document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle functionality (copied from news.js)
    const openMenuBtn = document.getElementById('openMenuBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const mobileMenuPanel = document.getElementById('mobileMenuPanel');

    if (openMenuBtn && closeMenuBtn && mobileMenuPanel) {
        openMenuBtn.addEventListener('click', () => {
            mobileMenuPanel.classList.add('visible');
        });
        closeMenuBtn.addEventListener('click', () => {
            mobileMenuPanel.classList.remove('visible');
        });
    } else {
        console.error('Mobile menu elements not found on search results page.');
    }

    const searchQueryDisplay = document.getElementById('search-query-display');
    const resultsContainer = document.getElementById('search-results-container');
    const noResultsMessage = document.getElementById('no-results-message');

    // Function to get query parameter from URL
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    // Function to create image with fallback (copied from news.js)
    function createImageElement(src, alt, fallbackSrc, className) {
        const img = document.createElement('img');
        img.src = src; 
        img.alt = alt;
        img.className = className;
        img.onerror = function() {
            console.warn(`Image failed to load: ${src}. Attempting fallback: ${fallbackSrc}`);
            this.onerror = null; 
            this.src = fallbackSrc;
        };
        return img;
    }

    // Function to filter articles
    function filterArticles(articles, query) {
        if (!query) return articles; 
        const lowerCaseQuery = query.toLowerCase();
        return articles.filter(article => {
            const headlineMatch = article.headline && article.headline.toLowerCase().includes(lowerCaseQuery);
            const bodyMatch = article.news_body && article.news_body.toLowerCase().includes(lowerCaseQuery);
            const tagsMatch = article.tags && Array.isArray(article.tags) && article.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery));
            const authorMatch = article.author && article.author.toLowerCase().includes(lowerCaseQuery);
            const categoryMatch = article.content_category && article.content_category.toLowerCase().includes(lowerCaseQuery);
            
            return headlineMatch || bodyMatch || tagsMatch || authorMatch || categoryMatch;
        });
    }

    // Function to render search results
    function renderSearchResults(articles) {
        resultsContainer.innerHTML = ''; 

        if (!articles || articles.length === 0) {
            noResultsMessage.style.display = 'block';
            resultsContainer.innerHTML = ''; 
            return;
        }

        noResultsMessage.style.display = 'none';

        articles.forEach(article => {
            const articleLink = document.createElement('a');
            // MODIFIED LINE FOR ARTICLE PAGE LINKING:
            // This assumes each 'article' object from your news_data.json has an 'id' property.
            articleLink.href = `article.html?id=${article.id}`; 
            articleLink.classList.add('article-link'); 
            articleLink.setAttribute('aria-label', `Read more about ${article.headline}`);
            
            const imageBox = document.createElement('div');
            imageBox.classList.add('image-box'); 
            const img = createImageElement(article.imageUrl, article.imageAlt, article.fallbackImageUrl, 'other-news-image');
            imageBox.appendChild(img);

            const textContentWrapper = document.createElement('div');
            textContentWrapper.classList.add('article-content-wrapper'); 

            const titleDiv = document.createElement('div');
            titleDiv.classList.add('article-title'); 
            titleDiv.textContent = article.headline;

            const snippetLength = 100; 
            let snippet = article.news_body || "";
            if (snippet.length > snippetLength) {
                snippet = snippet.substring(0, snippetLength) + "...";
            }

            const textDiv = document.createElement('div');
            textDiv.classList.add('article-text'); 
            textDiv.textContent = snippet; 
            
            textContentWrapper.appendChild(titleDiv);
            textContentWrapper.appendChild(textDiv);

            articleLink.appendChild(imageBox);
            articleLink.appendChild(textContentWrapper);
            resultsContainer.appendChild(articleLink);
        });
    }

    // Main function to initialize the page
    async function initSearchPage() {
        const query = getQueryParam('query');

        if (searchQueryDisplay) {
            if (query) {
                searchQueryDisplay.innerHTML = `Search Results for: <span class="query-term">"${decodeURIComponent(query)}"</span>`;
            } else {
                searchQueryDisplay.textContent = 'No search query provided.';
                noResultsMessage.style.display = 'block';
                resultsContainer.innerHTML = '';
                return;
            }
        }
        
        if (!query) return; 

        try {
            const response = await fetch('../json/news_data.json'); 
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            if (!data || !data.articles) {
                throw new Error("JSON data is not in the expected format.");
            }

            // Ensure each article in news_data.json has a unique 'id' property
            const filtered = filterArticles(data.articles, query);
            renderSearchResults(filtered);

        } catch (error) {
            console.error("Could not load or process search results:", error);
            resultsContainer.innerHTML = `<p>Error loading search results: ${error.message}</p>`;
            noResultsMessage.style.display = 'none';
        }
    }

    initSearchPage();
});