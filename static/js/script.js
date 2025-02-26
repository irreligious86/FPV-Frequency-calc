fetch('/static/data/fpv_channels.json')
    .then(response => response.json())
    .then(fpvData => {
        let bandInfo = fpvData["5.8GHz"]["Band A (Boscam)"];
        console.log("Band Info:", bandInfo);
        console.log("Channels:", bandInfo.channels);
    });

function updateChannels() {
    const bandSelect = document.getElementById("bandSelect");
    const channelSelect = document.getElementById("channelSelect");
    channelSelect.innerHTML = "";
    if (bandSelect.value === "") {
        channelSelect.disabled = true;
        channelSelect.innerHTML = "<option value=''>Выберите бенд</option>";
    } else {
        channelSelect.disabled = false;
        bandChannels[bandSelect.value].forEach(channel => {
            const option = document.createElement("option");
            option.value = channel;
            option.textContent = `Channel ${channel}`;
            channelSelect.appendChild(option);
        });
    }
}



// 

// Универсальная функция для привязки обработчика к кнопке
function attachButtonHandler(button, handlerFunction) {
    button.addEventListener("click", handlerFunction);
}

// Получаем коллекцию всех кнопок на странице
const buttons = document.querySelectorAll("button");

// Перебираем кнопки и привязываем обработчик событий
buttons.forEach(button => {
    button.addEventListener("click", () => {
        console.log(`Вы нажали на кнопку: ${button.innerText}`);
        
    });
});
