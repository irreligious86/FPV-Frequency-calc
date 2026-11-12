import { RANGES } from './channels.js';
import { LEVELS, analyzeSet, describeRating, rateCandidate, suggestChannels } from './interference.js';

const STORAGE_KEY = 'fpv-frequency-calc:v2';
const MIN_PILOTS = 2;
const MAX_PILOTS = 8;
const DEFAULT_PILOTS = 4;
const LEVEL_CLASSES = LEVELS.map((level) => `interference-${level}`);
const LEVEL_TEXT = {
    none: 'Clear',
    low: 'Low interference',
    medium: 'Medium interference',
    high: 'Conflict',
};

const $ = (id) => document.getElementById(id);

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function loadState() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
    } catch {
        return {};
    }
}

function saveState(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // Storage can be unavailable (private mode); the app works without it.
    }
}

export class App {
    constructor() {
        this.bands = [];
        this.channels = new Map(); // id -> channel
        this.bandById = new Map();
        this.selected = new Map(); // id -> channel, in pick order
        this.tiles = new Map(); // id -> button
        this.ratings = new Map(); // id -> { level, reason } for unselected tiles
        this.pilots = DEFAULT_PILOTS;
        this.tableShown = false;
        this.toastTimer = null;

        this.checkboxes = [...document.querySelectorAll('.filter-checkbox')];
        this.analyzeBtn = $('analyzeBtn');
        this.table = $('frequencyTable');
        this.panel = $('selectionPanel');
        this.modal = $('modal');
        this.modalOverlay = $('modalOverlay');
        this.toast = $('toast');
    }

    start(bands) {
        this.bands = bands;
        for (const band of bands) {
            this.bandById.set(band.id, band);
            for (const channel of band.channels) this.channels.set(channel.id, channel);
        }
        this.restore();
        this.bindEvents();
        this.updatePilots();
        this.updateAnalyzeButton();
        if (this.tableShown) this.renderTable();
    }

    // ----- state -----

    restore() {
        const state = loadState();
        const filters = state.filters ?? ['analog'];
        for (const box of this.checkboxes) box.checked = filters.includes(box.value);
        if (Number.isInteger(state.pilots)) {
            this.pilots = Math.min(MAX_PILOTS, Math.max(MIN_PILOTS, state.pilots));
        }
        for (const id of state.selected ?? []) {
            const channel = this.channels.get(id);
            if (channel && this.selected.size < this.pilots) this.selected.set(id, channel);
        }
        this.tableShown = this.selected.size > 0;
    }

    persist() {
        saveState({
            filters: this.activeFilters(),
            pilots: this.pilots,
            selected: [...this.selected.keys()],
        });
    }

    activeFilters() {
        return this.checkboxes.filter((box) => box.checked).map((box) => box.value);
    }

    // ----- events -----

    bindEvents() {
        for (const box of this.checkboxes) {
            box.addEventListener('change', () => {
                this.updateAnalyzeButton();
                if (this.tableShown) this.renderTable();
                this.persist();
            });
        }

        this.analyzeBtn.addEventListener('click', () => {
            this.tableShown = true;
            this.renderTable();
            this.table.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        $('pilotsMinus').addEventListener('click', () => this.setPilots(this.pilots - 1));
        $('pilotsPlus').addEventListener('click', () => this.setPilots(this.pilots + 1));
        $('optimizeBtn').addEventListener('click', () => this.optimize());
        $('clearBtn').addEventListener('click', () => this.clearSelection());

        // One delegated listener instead of one per channel tile.
        this.table.addEventListener('click', (event) => {
            const tile = event.target.closest('.channel');
            if (tile) this.onTileClick(this.channels.get(tile.dataset.id));
        });

        $('selectedList').addEventListener('click', (event) => {
            const button = event.target.closest('.remove-btn');
            if (button) this.toggle(this.channels.get(button.dataset.id));
        });

        $('modalClose').addEventListener('click', () => this.hideModal());
        this.modalOverlay.addEventListener('click', () => this.hideModal());
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') this.hideModal();
        });

        const scrollBtn = $('scrollTopBtn');
        scrollBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        window.addEventListener(
            'scroll',
            () => scrollBtn.classList.toggle('visible', window.scrollY > 300),
            { passive: true }
        );
    }

    updateAnalyzeButton() {
        const any = this.activeFilters().length > 0;
        this.analyzeBtn.disabled = !any;
        if (!any) {
            this.table.classList.add('hidden');
            this.panel.classList.add('hidden');
        }
    }

    setPilots(value) {
        const next = Math.min(MAX_PILOTS, Math.max(MIN_PILOTS, value));
        if (next < this.selected.size) {
            this.showToast(`Remove a channel first: ${this.selected.size} are selected`);
            return;
        }
        this.pilots = next;
        this.updatePilots();
        this.updatePanel();
        this.persist();
    }

    updatePilots() {
        $('pilotsValue').textContent = this.pilots;
        $('pilotsMinus').disabled = this.pilots <= MIN_PILOTS;
        $('pilotsPlus').disabled = this.pilots >= MAX_PILOTS;
    }

    // ----- table -----

    renderTable() {
        const filters = this.activeFilters();
        this.table.replaceChildren();
        this.tiles.clear();
        if (filters.length === 0) return;

        for (const range of RANGES) {
            const bands = this.bands.filter(
                (band) => band.range === range.key && filters.includes(band.modulation)
            );
            if (bands.length === 0) continue;

            const block = el('div', 'range-block');
            block.append(el('h3', 'range-title', range.label));
            for (const band of bands) block.append(this.renderBand(band));
            this.table.append(block);
        }

        this.table.classList.remove('hidden');
        this.panel.classList.remove('hidden');
        this.refresh();
    }

    renderBand(band) {
        const row = el('div', 'band-row');
        const name = el('div', 'band-name', band.title);
        name.title = `${band.name} · ${band.modulation}`;
        const container = el('div', 'channels-container');

        for (const channel of band.channels) {
            const wrapper = el('div', 'channel-wrapper');
            const label = band.title.length <= 2 ? channel.name : channel.number;
            wrapper.append(el('div', 'channel-number', label));

            const tile = el('button', 'channel', String(channel.frequency));
            tile.type = 'button';
            tile.dataset.id = channel.id;
            this.tiles.set(channel.id, tile);

            wrapper.append(tile);
            container.append(wrapper);
        }

        row.append(name, container);
        return row;
    }

    // ----- selection -----

    onTileClick(channel) {
        if (!channel) return;
        if (this.selected.has(channel.id)) {
            this.toggle(channel);
            return;
        }
        if (this.selected.size >= this.pilots) {
            this.showToast(`All ${this.pilots} pilot slots are taken. Raise "Pilots" or remove a channel.`);
            return;
        }
        const rating = this.ratings.get(channel.id);
        if (rating?.level === 'high') {
            this.showToast(`${channel.name} is blocked: ${rating.reason}`);
            return;
        }
        this.toggle(channel);
        this.showModal(channel);
    }

    toggle(channel) {
        if (this.selected.has(channel.id)) {
            this.selected.delete(channel.id);
        } else {
            this.selected.set(channel.id, channel);
        }
        this.refresh();
        this.persist();
    }

    clearSelection() {
        this.selected.clear();
        this.refresh();
        this.persist();
    }

    optimize() {
        const selected = [...this.selected.values()];
        if (selected.length === 0) {
            this.showToast('Pick at least one channel, then Optimize fills the rest from the same band.');
            return;
        }
        if (selected.length >= this.pilots) {
            this.showToast(`All ${this.pilots} pilot slots are already filled.`);
            return;
        }

        // Search only the bands the pilots are already using.
        const bandIds = new Set(selected.map((channel) => channel.bandId));
        const pool = [...bandIds].flatMap((id) => this.bandById.get(id).channels);
        const added = suggestChannels(selected, pool, this.pilots);

        if (!added) {
            this.showToast(`No conflict-free set of ${this.pilots} channels in the selected band(s).`);
            return;
        }
        for (const channel of added) this.selected.set(channel.id, channel);
        this.refresh();
        this.persist();
        this.showToast(`Added ${added.map((channel) => channel.name).join(', ')}`);
    }

    // ----- rendering of derived state -----

    refresh() {
        const selected = [...this.selected.values()];
        this.ratings.clear();

        for (const [id, tile] of this.tiles) {
            const channel = this.channels.get(id);
            const isSelected = this.selected.has(id);
            tile.classList.remove('selected', ...LEVEL_CLASSES);
            tile.setAttribute('aria-pressed', String(isSelected));

            if (isSelected) {
                tile.classList.add('selected');
                tile.title = `${channel.name} · selected`;
                continue;
            }
            const rating = rateCandidate(selected, channel);
            this.ratings.set(id, rating);
            tile.classList.add(`interference-${rating.level}`);
            tile.title = rating.reason
                ? `${channel.name} · ${LEVEL_TEXT[rating.level]}: ${rating.reason}`
                : `${channel.name} · ${LEVEL_TEXT[rating.level]}`;
        }

        this.updatePanel();
    }

    updatePanel() {
        const analysis = analyzeSet([...this.selected.values()]);
        $('panelCount').textContent = `${this.selected.size}/${this.pilots}`;

        const list = $('selectedList');
        list.replaceChildren();
        for (const rating of analysis.channels) {
            const { channel } = rating;
            const item = el('li', 'selected-channel-item');
            const dot = el('span', `swatch interference-${rating.level}`);
            dot.title = LEVEL_TEXT[rating.level];
            const remove = el('button', 'remove-btn', '×');
            remove.type = 'button';
            remove.dataset.id = channel.id;
            remove.setAttribute('aria-label', `Remove ${channel.name}`);
            item.append(
                dot,
                el('span', 'selected-name', channel.name),
                el('span', 'channel-freq', `${channel.frequency} MHz`),
                remove
            );
            list.append(item);

            const reason = describeRating(rating);
            if (reason) list.append(el('li', 'selected-reason', reason));
        }

        const verdict = $('panelVerdict');
        verdict.className = `panel-verdict interference-${analysis.level}`;
        verdict.textContent =
            this.selected.size < 2 ? 'Select two or more channels' : LEVEL_TEXT[analysis.level];

        $('optimizeBtn').disabled = this.selected.size === 0 || this.selected.size >= this.pilots;
        $('clearBtn').disabled = this.selected.size === 0;
    }

    // ----- modal and toast -----

    showModal(channel) {
        const band = this.bandById.get(channel.bandId);
        const half = channel.width / 2;
        const rating = analyzeSet([...this.selected.values()]).channels.find(
            (r) => r.channel.id === channel.id
        );
        const status = describeRating(rating);

        $('modalName').textContent = channel.name;
        $('modalFrequency').textContent = channel.frequency;

        const rows = [
            ['Band', band.name],
            ['Channel', channel.number],
            ['Frequency range', `${channel.frequency - half} – ${channel.frequency + half} MHz`],
            ['Channel width', `${channel.width} MHz`],
            ['Modulation', band.modulation === 'analog' ? 'Analog' : 'Digital'],
            ['Region', band.region],
            ['With selection', status ? `${LEVEL_TEXT[rating.level]}: ${status}` : LEVEL_TEXT.none],
        ];
        const info = $('modalInfo');
        info.replaceChildren();
        for (const [label, value] of rows) {
            const row = el('div', 'info-row');
            row.append(el('dt', 'info-label', label), el('dd', 'info-value', String(value)));
            info.append(row);
        }

        this.modalOverlay.classList.add('active');
        this.modal.classList.add('active');
        $('modalClose').focus();
    }

    hideModal() {
        this.modalOverlay.classList.remove('active');
        this.modal.classList.remove('active');
    }

    showToast(message) {
        this.toast.textContent = message;
        this.toast.classList.add('visible');
        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => this.toast.classList.remove('visible'), 4000);
    }
}
