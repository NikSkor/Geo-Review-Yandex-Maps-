import './style/style.scss';
import { getToday } from './js/date.js';
import reviewBlock from './index/review-block.hbs';

let review = document.querySelector('.review');
let revBlock = document.querySelector('.review__list');
let closeBtn = document.querySelector('.header__button');
let inputName = document.querySelector('.form__input_name');
let inputPlace = document.querySelector('.form__input_place');
let inputText = document.querySelector('.form__textarea__text');
let saveBtn = document.querySelector('.form__btn');
let form = document.querySelector('.form');
let inputsArr = [inputName, inputPlace, inputText];
let headTitle = document.querySelector('.header__title');
let addressInput = document.getElementById('address');
let coordsInput = document.getElementById('coords');
let comments = localStorage.getItem('comments') ? JSON.parse(localStorage.getItem('comments')) : [];

let myMap;

ymaps.ready(init);

function init() {
    
    myMap = new ymaps.Map('map', {
        center: [55.76, 37.64],
        zoom: 10,
        controls: ['zoomControl', 'searchControl', 'typeSelector', 'geolocationControl']
    }, 
    {
        searchControlProvider: 'yandex#search'
    });

    let objectManager = new ymaps.ObjectManager({
        preset: 'islands#invertedVioletClusterIcons',
        clusterDisableClickZoom: true,
        clusterize: true,
        clusterBalloonContentLayout: 'cluster#balloonCarousel',
        clusterBalloonContentLayoutWidth: 200,
        clusterBalloonContentLayoutHeight: 150,
    });

    objectManager.options.set('geoObjectOpenBalloonOnClick', false);
    myMap.geoObjects.add(objectManager);

    function setComment({ address, coords, name, place, text }) {
        let comment = {
            address,
            coords: coords.split(',').map(parseFloat),
            name,
            place,
            textReview: text,
            date: getToday()
        }

        comments.push(comment);
        localStorage.setItem('comments', JSON.stringify(comments));
        form.reset();
    }

    function getComments(address) {
        const filteredComments = comments.filter((comment) => {
            
            return comment.address == address;
        });
        
        revBlock.innerHTML = '';
        let templatedComments = reviewBlock({ reviews: filteredComments });

        revBlock.innerHTML = templatedComments;
    }
    function revSwitch({ address, coords, isVisible }) {
        if (isVisible) {
            addressInput.value = address;
            coordsInput.value = coords;
            headTitle.innerText = address;
        
            review.classList.remove('hide');
            review.style.top = event.clientY + 'px';
            review.style.left = event.clientX + 'px';
            
            return;
        }
        
        review.classList.add('hide');
    }
    myMap.events.add('click', function (e) {
        let coords = e.get('coords');

        revBlock.innerHTML = '';
        revBlock.innerText = 'Пока нет комментариев';
        
        ymaps.geocode(coords).then((result) => {
            let geoInfo = result.geoObjects.get(0);
            let address = geoInfo.properties.get('text');

            for (let comment of comments) {
                if (comment.address === address) {
                    coords = comment.coords;    
                }
            }

            revSwitch({ address, coords, isVisible: true });
            getComments(address);
            
        })   
    });
    closeBtn.addEventListener('click', () => {
        revSwitch({ isVisible: false });
    });
    function validateForm() {
        let isValid = true;
    
        for ( let elem of inputsArr ) {

            if ( elem.value === '' ) {
                elem.style.border='1px solid red';
                isValid = false;
            } else {
                elem.style.border='1px solid #c4c4c4';
            }
        }

        return isValid;   
    }
    objectManager.objects.events.add('click', (e) => {
        let objectId = e.get('objectId');
        let { address, coords } = comments[objectId];

        getComments(address);
        revSwitch({ address, coords, isVisible: true });
    })
    objectManager.clusters.events.add('balloonopen', () => {
        revSwitch({ isVisible: false });
    })
    saveBtn.addEventListener('click', (e) => {
        e.preventDefault();
        let isValid = validateForm();
    
        if ( isValid ) {
            const address = addressInput.value;
            const coords = coordsInput.value;
            const name = inputName.value;
            const place = inputPlace.value;
            const text = inputText.value;
    
            setComment({ address, coords, name, place, text });
            revSwitch({ isVisible: false });
            setMap();
        }
    });
    function setMap() {
        comments.forEach((comment, i) => {
            objectManager.objects.add({
                type: 'Feature',
                id: i,
                geometry: {
                    type: 'Point',
                    coordinates: comment.coords
                    
                },
                properties: {
                    balloonContentHeader: `<b> ${comment.place}</b>`,
                    balloonContentBody: `<a href="#" class="address_link" data-id="${i}">${comment.address}</a><br/>
                                        <p><b>${comment.textReview}</b></p>`,
                    balloonContentFooter: `<div style="float: right">${comment.date}</div>`
                }
            })
        })
    }
    document.addEventListener('click', (e) => {
        let target = e.target;

        if ( target.className === 'address_link' ) {
            let id = target.dataset.id;
            let { address, coords } = comments[id];

            getComments(address);
            revSwitch({ address, coords, isVisible: true });
            objectManager.clusters.balloon.close();
        }
    });
    setMap();
}