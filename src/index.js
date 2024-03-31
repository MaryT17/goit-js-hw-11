import axios from 'axios';
import { Notify } from 'notiflix';
import SimpleLightbox from 'simplelightbox';

import 'simplelightbox/dist/simple-lightbox.min.css';

const gallery = document.querySelector('.gallery');
const searchForm = document.getElementById('search-form');
const sentinel = document.querySelector('#sentinel');
const apiKey = '43044610-d550c81fa796654bf6e6a3a83';
let isLoading = false;
let page = 1;
const perPage = 40;
let searchQuery = '';
let lightbox = new SimpleLightbox('.gallery a');
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 1.0,
};
const observer = new IntersectionObserver(onGalleryVisible, observerOptions);

function clearGallery() {
  page = 1;
  gallery.innerHTML = '';
  lightbox.destroy();
  lightbox = new SimpleLightbox('.gallery a');
  sentinel.style.display = 'none';
}

function createImageCardMarkup(image) {
  return `<div class="photo-card">
    <a href="${image.largeImageURL}">
      <img src="${image.webformatURL}" alt="${image.tags}" loading="lazy" />
    </a>
    <div class="info">
      <p class="info-item">
        <b>Likes</b>
        <span>${image.likes}</span>
      </p>
      <p class="info-item">
        <b>Views</b>
        <span>${image.views}</span>
      </p>
      <p class="info-item">
        <b>Comments</b>
        <span>${image.comments}</span>
      </p>
      <p class="info-item">
        <b>Downloads</b>
        <span>${image.downloads}</span>
      </p>
    </div>
  </div>`;
}

async function fetchImages() {
  const url = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(
    searchQuery
  )}&image_type=photo&orientation=horizontal&safesearch=true&page=${page}&per_page=${perPage}`;

  try {
    const { data } = await axios.get(url);

    if (data.hits.length === 0) {
      Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
      sentinel.style.display = 'none';

      return;
    }

    renderImageCards(data.hits);

    sentinel.style.display = page * perPage < data.totalHits ? 'block' : 'none';

    if (page * perPage >= data.totalHits) {
      Notify.warning(
        "We're sorry, but you've reached the end of search results."
      );
    }

    return data.totalHits;
  } catch (err) {
    Notify.failure('An error occurred while fetching images.');
  }
}

async function loadMore() {
  page++;
  await fetchImages();
  smoothScrollToNewImages();
}

async function onGalleryVisible(entries) {
  for (const entry of entries) {
    if (entry.isIntersecting && !isLoading) {
      isLoading = true;

      await loadMore();

      isLoading = false;
    }
  }
}

function smoothScrollToNewImages() {
  const { height: cardHeight } = document
    .querySelector('.gallery')
    .firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
}

function renderImageCards(images) {
  const markup = images.map(image => createImageCardMarkup(image)).join('');
  gallery.insertAdjacentHTML('beforeend', markup);
  lightbox.refresh();
}

searchForm.addEventListener('submit', async event => {
  event.preventDefault();
  clearGallery();

  searchQuery = event.target.elements.searchQuery.value;

  const totalHits = await fetchImages();

  if (totalHits) {
    Notify.success(`Hooray! We found ${totalHits} images.`);
  }
});

sentinel.style.display = 'none';
observer.observe(sentinel);
