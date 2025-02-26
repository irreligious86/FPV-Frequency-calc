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
