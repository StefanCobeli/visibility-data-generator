
// Adapted into vanilla CSS/JavaScript from React/TypeScript in article
// https://newsakmi.com/news/tech-news/software/lets-make-a-multi-thumb-slider-that-calculates-the-width-between-thumbs
export default class MultiThumbSlider {
    constructor() {
        this.queryModesToTags = {
            'scenario': [
                { name: 'Water', color: '#67758D', value: 15},
                { name: 'Tree', color: '#4E5B3D', value: 15 },
                { name: 'Building', color: '#868686', value: 14 },
                { name: 'Road', color: '#A7A7A7', value: 14 },
                { name: 'Sidewalk', color: '#999991', value: 14 },
                { name: 'Surface', color: '#859074', value: 14 },
                { name: 'Sky', color: '#BDDADA', value: 14 },
            ],
            'openess': [
                { name: 'Openness', color: '#505050', value: 17 },
                { name: 'Greenness', color: '#7b8f1e', value: 17 },
                { name: 'Walkability', color: '#8f6b1e', value: 17 },
                { name: 'Serenity', color: '#1e8f8d', value: 17 },
                { name: 'Enclosure', color: '#1e268f', value: 16 },
                { name: 'Imageability', color: '#881e8f', value: 16 },
            ],
            'building': [
                { name: 'Brick', color: '#8f1e5b', value: 20 },
                { name: 'Concrete', color: '#1e8f89', value: 20 },
                { name: 'Marble', color: '#bcb833', value: 20 },
                { name: 'Plaster', color: '#d7e2a7', value: 20 },
                { name: 'Metal', color: '#29d53b', value: 20 },
            ]
        }
        this.tags = this.queryModesToTags['scenario'];
        this.sliderElement = document.querySelector('.slider');

        experience.world.setQueryParameters(this.tags);

        window.addEventListener('DOMContentLoaded', (event) => {
            this.tagsToHtml(this.tags);
        });

    }

    onSliderSelect(event, sliderThumb) {
        // console.log(this.tags);
        document.body.style.cursor = 'ew-resize';

        let tagIndex = parseInt(sliderThumb.parentNode.getAttribute('data-tag-index'));
        let tag = this.tags[tagIndex];
        let startDragX = event.pageX;
        let sliderWidth = this.sliderElement.offsetWidth;
        let values = this.tags.map((tag) => tag.value); // initial values

        // The onResize and onEventUp listeners are specific to each
        // onSliderSelect event hence created inside
        let onResize = (event) => {
            event.preventDefault();

            let endDragX = event.touches ? event.touches[0].pageX : event.pageX;
            let distanceMoved = endDragX - startDragX;

            values = this.tags.map((tag) => tag.value); // read in updated values
            let maxValue = values[tagIndex] + values[tagIndex + 1];
            let valueMoved = this.nearestMultiple(1, this.getPercent(sliderWidth, distanceMoved));
            let prevValue = values[tagIndex];
            let newValue = prevValue + valueMoved;

            let currTagValue = this.clamp(newValue, 0, maxValue);
            values[tagIndex] = currTagValue;

            let nextTagIndex = tagIndex + 1;
            let nextTagNewValue = values[nextTagIndex] - valueMoved;
            let nextTagValue = this.clamp(nextTagNewValue, 0, maxValue);
            values[nextTagIndex] = nextTagValue;

            // Update slider
            Array.from(document.querySelectorAll('.tag')).forEach((tagElement) => {
                let tagIndex = parseInt(tagElement.getAttribute('data-tag-index'));
                let value = values[tagIndex];

                tagElement.style.width = value + '%';
                tagElement.querySelector('.tag-value').innerHTML = value + '%';
            });
        };

        let removeEventListener = () => {
            window.removeEventListener('pointermove', onResize);
            window.removeEventListener('touchmove', onResize);

            // Update values only when user stops moving slider thumb
            this.tags.forEach((tag, tagIndex) => {
                tag.value = values[tagIndex];
            });

            this.emitEvent();
        };
        //Kazi passing query parameters to backed
        let onEventUp = (event) => {
            event.preventDefault();
            document.body.style.cursor = 'initial';
            // Send new query values to World
            experience.world.setQueryParameters(this.tags);
            // console.log(this.tags);
            removeEventListener();
        };

        window.addEventListener('pointermove', onResize);
        window.addEventListener('touchmove', onResize);
        window.addEventListener("touchend", onEventUp);
        window.addEventListener("pointerup", onEventUp);
    };
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    emitEvent() {
        this.sliderElement.dispatchEvent(new CustomEvent('demo.slider.this.tags', {
            bubbles: false,
            detail: {
                tags: this.tags,
            }
        }));
    }
    getPercent(containerWidth, distanceMoved) {
        return (distanceMoved / containerWidth) * 100;
    }
    nearestMultiple(divisor, number) {
        return Math.ceil(number / divisor) * divisor;
    }
    tagsToHtml(tags) {
        let html = '';

        tags.forEach((tag, index) => {
            // Using pointerdown instead of mousedown to capture both mouse and touchscreen
            // events. See
            // https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onpointerdown
            // for more info.
            html += `
            <div class="tag" data-tag-index="${index}"
              style="background:${tag.color}; width:${tag.value}%;">
              <div class="tag-container">
                <span class="tag-text tag-name">${tag.name}</span>
                <span class="tag-text tag-value">${tag.value}%</span>
              </div>
              <div class="slider-thumb"
                onpointerdown="experience.multiThumbSlider.onSliderSelect(event, this);">
                <span>⬌</span>
                </div>
            </div>
        `;
        });

        document.querySelector('.slider').innerHTML = html;
    }
}