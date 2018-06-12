// import { getDate } from './date.js';
import getView from './js/view.js';
import getSet from './js/set.js';

// let revBlock = document.querySelector('.review__block');
// let closeBtn = document.querySelector('.header__button');
// let revList = document.querySelector('.review__list');
// let inputName = document.querySelector('.form__input_name');
// let inputPlace = document.querySelector('.form__input_place');
// let inputText = document.querySelector('.form__textarea__text');
// let saveBtn = document.querySelector('.form__btn');
// let form = document.querySelector('.form');
// let inputsArr = [inputName, inputPlace, inputText];
// let headTitle = document.querySelector('.header__title');
// const addressInput = document.getElementById('address');
// // скрытое поле для координат
// const coordsInput = document.getElementById('coords');
// const comments = localStorage.getItem('comments') ? JSON.parse(localStorage.getItem('comments')) : [];
let map = document.querySelector('.map');
let storage = getSet.getReviews();
let clusterer;

let myMap;

ymaps.ready(init);

function init() {
    myMap = new ymaps.Map('map', {
        center: [55.76, 37.64],
        zoom: 10,
        controls: ['zoomControl', 'searchControl', 'typeSelector', 'geolocationControl']
    }, {
        searchControlProvider: 'yandex#search'
    });
    let objectManager = new ymaps.ObjectManager({
        preset: 'islands#invertedVioletClusterIcons',
        clusterDisableClickZoom: true,
        clusterize: true,
        clusterBalloonContentLayout: 'cluster#balloonCarousel',
        clusterBalloonContentLayoutWidth: 200,
        clusterBalloonContentLayoutHeight: 150,
        clusterBalloonItemContentLayout: customItemContentLayout,
        clusterBalloonPanelMaxMapArea: 0
    });

    let customItemContentLayout = ymaps.templateLayoutFactory.createClass (
        // Флаг "raw" означает, что данные вставляют "как есть" без экранирования html.
        '<h2 class=ballon_header>{{ properties.balloonContentHeader|raw }}</h2>' +
            '<div class=ballon_body>{{ properties.balloonContentBody|raw }}</div>' +
            '<div class=ballon_footer>{{ properties.balloonContentFooter|raw }}</div>'
    );

    // запрет открывать баллун по одиночной метке
    objectManager.options.set('geoObjectOpenBalloonOnClick', false);
    // добавить objectManager
    myMap.geoObjects.add(objectManager);
    createIcons(storage);

    myMap.events.add('click', (e) => {
        let windowCoords = e.get('pagePixels');
        let targetCoords = e.get('coords');                      

        getAddress(targetCoords)
            .then((address) => {
                createContainer(windowCoords, targetCoords, address);
            });
    });
    
    map.addEventListener('click', (e) => {
        if (e.target.dataset.coord) {
            let targetCoords = e.target.dataset.coord;
            let windowCoords = [e.clientX, e.clientY]; 

            clusterer.balloon.close();

            getAddress(targetCoords)
                .then((address) => {
                    createContainer(windowCoords, targetCoords, address);
                });
        }
    });

    function getAddress(coords) {
        return ymaps.geocode(coords).then((res) => {
            let firstGeoObject = res.geoObjects.get(0);
            
            return firstGeoObject.getAddressLine();
        });
    }

    function createIcon(coords, review) {
        let icon = new ymaps.Placemark(coords, {
            openBalloonOnClick: false,
            balloonContentHeader: review.place,
            balloonContentCoords: review.coords,
            balloonContentLink: review.address,
            balloonContentBody: review.text,
            balloonContentFooter: review.date
        }, { preset: 'islands#blueHomeCircleIcon' });
        
        icon.events.add('click', (e) => {
            e.preventDefault();
            let windowCoords = e.get('pagePixels');

            getAddress(coords)
                .then((address) => {
                    createContainer(windowCoords, coords, address);
                });                    
        });

        myMap.geoObjects.add(icon);
        clusterer.add(icon);
    }

    function createIcons(storage) {
        storage.forEach((review) => {
            createIcon(review.coords, review);
        });
    }

    function createContainer(windowCoords, targetCoords, address) {
        let exsistReviews = getSet.searchReviewsByAddress(address);
        let container = getView.renderReview(windowCoords, targetCoords, address, map, exsistReviews);                        
        let submitBtn = document.querySelector('.form__btn');
        let closeBtn = document.querySelector('.header__button');

        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            let formElements = [...document.querySelector('.form').elements];
            let newReview = getSet.saveReviews(address, formElements, targetCoords);

            createIcon(targetCoords, newReview);
            // getView.addReview(container, newReview);
        });

        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            getView.destroyChild(map, container);
        });

        return container;
    }
    
}