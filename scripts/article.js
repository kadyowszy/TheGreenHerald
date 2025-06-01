document.addEventListener('DOMContentLoaded', () => {
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
        console.warn('Mobile menu elements not found on article page. This might be expected if they are not part of article.html.');
    }

    const headlineEl = document.getElementById('article-headline');
    const authorEl = document.getElementById('article-author');
    const dateEl = document.getElementById('article-date');
    const categoryEl = document.getElementById('article-category');
    const imageEl = document.getElementById('article-image');
    const bodyEl = document.getElementById('article-body');
    const tagsContainerEl = document.getElementById('article-tags-container');
    const tagsEl = document.getElementById('article-tags');
    const articleNotFoundEl = document.getElementById('article-not-found');
    const fullArticleContentEl = document.getElementById('full-article-content');

    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        
        const dateObj = new Date(dateString + 'T00:00:00');
        if (isNaN(dateObj.getTime())) {
            console.warn('Invalid date string provided:', dateString);
            return dateString;
        }
        return dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function displayArticle(articleMetadata, bodyText) {
        if (!fullArticleContentEl || !articleNotFoundEl) {
            console.error("Essential article display elements are missing from the DOM.");
            return;
        }

        if (!articleMetadata) {
            fullArticleContentEl.style.display = 'none';
            articleNotFoundEl.style.display = 'block';
            if (headlineEl) headlineEl.textContent = 'Article Not Found';
            document.title = "Article Not Found - The Green Herald";
            return;
        }

        document.title = `${articleMetadata.headline || 'Article'} - The Green Herald`;

        if (headlineEl) {
            headlineEl.textContent = articleMetadata.headline || 'Headline Not Available';
        }
        
        if (authorEl) {
            if (articleMetadata.author) {
                authorEl.textContent = `By ${articleMetadata.author}`;
                authorEl.style.display = 'inline';
            } else {
                authorEl.style.display = 'none';
            }
        }

        if (dateEl) {
            dateEl.textContent = formatDate(articleMetadata.date);
        }
        
        if (categoryEl) {
            if (articleMetadata.content_category) {
                categoryEl.textContent = articleMetadata.content_category;
                categoryEl.style.display = 'inline';
            } else {
                categoryEl.style.display = 'none';
            }
        }
        
        if (imageEl) {
            imageEl.src = articleMetadata.imageUrl || 'https://placehold.co/800x450/cccccc/969696?text=Image+Not+Available';
            imageEl.alt = articleMetadata.imageAlt || articleMetadata.headline || 'Article image';
            imageEl.onerror = function() {
                this.onerror = null;
                this.src = articleMetadata.fallbackImageUrl || 'https://placehold.co/800x450/cccccc/969696?text=Image+Error';
                this.alt = 'Error loading image. Fallback shown.';
            };
        }

        if (bodyEl) {
            if (bodyText !== null && bodyText !== undefined) {
                bodyEl.innerHTML = bodyText;
            } else {
                bodyEl.innerHTML = '<p><em>Article content is currently unavailable. Please check back later.</em></p>';
            }
        }

        if (tagsContainerEl && tagsEl) {
            if (articleMetadata.tags && Array.isArray(articleMetadata.tags) && articleMetadata.tags.length > 0) {
                tagsEl.innerHTML = '';
                articleMetadata.tags.forEach(tagText => {
                    const tagSpan = document.createElement('span');
                    tagSpan.classList.add('tag-item');
                    tagSpan.textContent = tagText;
                    tagsEl.appendChild(tagSpan);
                });
                tagsContainerEl.style.display = 'block';
            } else {
                tagsContainerEl.style.display = 'none';
            }
        }
        
        fullArticleContentEl.style.display = 'block';
        articleNotFoundEl.style.display = 'none';
    }

    async function initArticlePage() {
        const articleId = getQueryParam('id');

        if (!articleId) {
            console.warn('No article ID provided in the URL.');
            displayArticle(null, null);
            return;
        }

        let articleMetadata = null;
        let articleBodyText = null;

        try {
            const metadataResponse = await fetch('../json/news_data.json');
            if (!metadataResponse.ok) {
                throw new Error(`HTTP error! status: ${metadataResponse.status} while fetching news_data.json`);
            }
            const newsData = await metadataResponse.json();

            if (!newsData || !newsData.articles || !Array.isArray(newsData.articles)) {
                throw new Error("News JSON data is not in the expected format or 'articles' array is missing.");
            }

            articleMetadata = newsData.articles.find(art => art.id === articleId);

            if (!articleMetadata) {
                console.warn(`Article metadata not found for ID: ${articleId}`);
                displayArticle(null, null);
                return;
            }

            const bodyTextPath = `../assets/articles/news/${articleId}.txt`;
            try {
                const bodyResponse = await fetch(bodyTextPath);
                if (bodyResponse.ok) {
                    articleBodyText = await bodyResponse.text();
                } else {
                    console.warn(`Article body text file not found at ${bodyTextPath} (Status: ${bodyResponse.status}). Displaying article with available metadata.`);
                }
            } catch (bodyFetchError) {
                console.error(`Error fetching article body from ${bodyTextPath}:`, bodyFetchError);
            }

            displayArticle(articleMetadata, articleBodyText);

        } catch (error) {
            console.error("Could not load or display article:", error);

            if (articleMetadata) {
                displayArticle(articleMetadata, null); 
                if (bodyEl) {
                     bodyEl.innerHTML = `<p><em>Article content could not be loaded. ${error.message}</em></p>`;
                }
            } else {
                displayArticle(null, null);
            }
            
            if (headlineEl) {
                headlineEl.textContent = 'Error Loading Article';
            }
        }
    }

    if (fullArticleContentEl && articleNotFoundEl) {
        initArticlePage();
    } else {
        console.error("Cannot initialize article page: one or more critical DOM elements are missing (e.g., #full-article-content or #article-not-found).");
    }
});