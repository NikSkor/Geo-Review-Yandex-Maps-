// Создание метки 
var myPlacemark = new ymaps.Placemark(
    // Координаты метки
    [56.315695, 44.017063], {
        // Свойства
        // Текст метки
        hintContent: 'Оперный театр'
    }, {
        iconImageHref: '../img/gray.png', // картинка иконки
        iconImageSize: [12, 20], // размеры картинки
        iconImageOffset: [-6, -10] // смещение картинки
    });     


    // Добавление метки на карту
myMap.geoObjects.add(myPlacemark);