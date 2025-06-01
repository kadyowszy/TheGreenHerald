document.addEventListener('DOMContentLoaded', () => {
    const postDetailContainer = document.getElementById('post-detail-content');
    const loadingMessage = document.getElementById('loading-message');
    const errorMessage = document.getElementById('error-message');

    // --- Flair to CSS Class Mapping (can be shared or duplicated) ---
    const flairClassMap = {
        'announcement': 'badge-announcement',
        'mod post': 'badge-mod-post',
        'fluff/meme': 'badge-fluff-meme',
        'events': 'badge-events',
        'guides/tips': 'badge-guides-tips',
        'academics': 'badge-academics',
        'questions': 'badge-questions',
        'hot': 'badge-hot',
        'rant': 'badge-rant',
        'unrelated to cvsu': 'badge-unrelated',
        'shady': 'badge-shady',
        'anon post': 'badge-anon-post',
        'media': 'badge-media',
        'general': 'badge-questions'
    };
    const getFlairClass = (flairText) => {
        const lowerFlairText = (flairText || '').toLowerCase().trim();
        return flairClassMap[lowerFlairText] || 'badge-questions';
    };

    // Path to your data file
    const FORUM_DATA_PATH = '../json/forum_data.json'; // Relative to sections/forumpost.html

    // Function to fetch all forum data
    async function fetchAllForumData() {
        try {
            const response = await fetch(FORUM_DATA_PATH);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} while fetching ${FORUM_DATA_PATH}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Could not fetch forum data:", error);
            throw error; // Re-throw to be caught by the caller
        }
    }

    // Function to find a specific post by ID from the fetched data
    async function fetchPostById(postId) {
        try {
            const allPosts = await fetchAllForumData();
            const post = allPosts.find(p => p.id === postId);
            
            if (post) {
                return post;
            } else {
                console.warn(`Post ID ${postId} not found in fetched data from ${FORUM_DATA_PATH}.`);
                return null; // Resolve with null if not found
            }
        } catch (error) {
            // Error already logged by fetchAllForumData
            throw error; // Re-throw
        }
    }

    function displayPost(postData) {
    if (!postData) {
        loadingMessage.style.display = 'none';
        errorMessage.style.display = 'block';
        errorMessage.textContent = `Could not load post. The post ID (${urlParams.get('id')}) might be incorrect or the post doesn't exist in forum_data.json. For newly created posts, persistence to 'forum_data.json' is simulated on the forums page and they won't appear here unless you manually add their data to the actual 'data/forum_data.json' file.`;
        return;
    }

    loadingMessage.style.display = 'none';
    errorMessage.style.display = 'none';

    const flairClass = getFlairClass(postData.flair);
    const displayFlairText = postData.flair || 'General';

    let authorAvatarClass = 'author-avatar';
    // This logic for authorAvatarClass is from your original code.
    // The first 'if' statement has an empty body, which might be an oversight or placeholder.
    if (postData.author !== 'smllnce' || postData.isPinned) {
        // This block is currently empty.
        // Pinned post by iamline has default gold, other posts by iamline might be gray unless specified
        // This logic might need refinement based on your exact avatar rules
    }
    if (postData.author !== 'smllnce') {
        authorAvatarClass += ' gray';
    }

    // --- MODIFICATION START ---
    // Determine the HTML for the author's avatar
    let authorAvatarHTML;
    const avatarContainerAriaHidden = 'true'; // As per original, assuming avatar is decorative

    if (postData.avatarImageUrl) {
        // If avatarImageUrl exists, use an <img> tag.
        // The inline styles ensure the image fills its container (the div with authorAvatarClass)
        // and inherits any border-radius from it (e.g., for circular avatars).
        // alt="" is used because the container div has aria-hidden="true", implying the avatar is decorative.
        const imageHTML = `<img src="${postData.avatarImageUrl}" alt="" style="width: 100%; height: 100%; object-fit: cover; border-radius: inherit;">`;
        authorAvatarHTML = `<div class="${authorAvatarClass}" aria-hidden="${avatarContainerAriaHidden}">${imageHTML}</div>`;
    } else {
        // Fallback to the character-based avatar
        const charAvatarHTML = `<span>${postData.avatarChar || postData.author.charAt(0).toUpperCase()}</span>`;
        authorAvatarHTML = `<div class="${authorAvatarClass}" aria-hidden="${avatarContainerAriaHidden}">${charAvatarHTML}</div>`;
    }
    // --- MODIFICATION END ---

    const badgesHTML = `<span class="badge ${flairClass}">${displayFlairText.charAt(0).toUpperCase() + displayFlairText.slice(1)}</span>` +
                       (postData.customBadges ? postData.customBadges.map(b => `<span class="badge ${getFlairClass(b.text.toLowerCase())}">${b.text}</span>`).join('') : '');

    postDetailContainer.innerHTML = `
        ${postData.isPinned ? '<span class="post-pin-icon" aria-hidden="true">📌</span>' : ''}
        <div class="post-badges">${badgesHTML}</div>
        <h1 class="post-title">${postData.title}</h1>
        <div class="post-footer">
            <div class="post-author">
                ${authorAvatarHTML}
                <span class="author-name style="color: var(--text-light);">${postData.author}</span>
                <span class="post-timestamp"><time datetime="${postData.datetime}">${postData.timeAgo}</time></span>
            </div>
            <div class="post-engagement">
                <div class="engagement-item">
                    <i class="fas fa-thumbs-up" aria-hidden="true"></i>
                    <span>${postData.likes} Like${postData.likes !== 1 ? 's' : ''}</span>
                </div>
                <div class="engagement-item">
                    ${postData.isLocked ? '<i class="fas fa-lock" aria-hidden="true"></i>' : ''}
                    <span class="replies-count">${postData.replies} Repl${postData.replies !== 1 ? 'ies' : 'y'}</span>
                </div>
            </div>
        </div>
        <hr style="border-color: rgba(var(--text-light-rgb), 0.2); margin: 1.5rem 0;">
        <p class="post-text">${postData.content.replace(/\n/g, '<br>')}</p>
    `;

    // Display comments
    const commentsList = document.getElementById('comments-list');
    if (postData.comments && postData.comments.length > 0) {
        commentsList.innerHTML = postData.comments.map(comment => `
            <div class="comment">
                <p>${comment.text}</p>
                <p class="comment-author">By ${comment.author} - <time>${comment.timestamp}</time></p>
            </div>
        `).join('');
    } else {
        commentsList.innerHTML = '<p>No comments yet for this post.</p>';
    }
}

    // --- Main execution ---
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (postId) {
        fetchPostById(postId)
            .then(postData => {
                displayPost(postData);
            })
            .catch(error => { // Catch errors from fetchPostById or fetchAllForumData
                console.error("Error fetching or displaying post:", error);
                loadingMessage.style.display = 'none';
                errorMessage.style.display = 'block';
                errorMessage.textContent = 'An error occurred while trying to load the post data. Check the console for details.';
            });
    } else {
        loadingMessage.style.display = 'none';
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'No post ID provided in the URL.';
    }

    // Mobile menu (simplified, or ensure forums.js handles it if included)
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    // Add corresponding close button logic if you copied the full mobile menu HTML
    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            const isVisible = mobileMenu.classList.toggle('visible');
            mobileMenu.classList.toggle('hidden', !isVisible);
            menuBtn.setAttribute('aria-expanded', isVisible.toString());
        });
        // If you have a close button for mobile menu in forumpost.html
        const closeMenuBtn = document.getElementById('close-btn'); // Assuming it exists in forumpost.html's mobile menu
         if (closeMenuBtn) {
            closeMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.remove('visible');
                mobileMenu.classList.add('hidden');
                if(menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
            });
        }
    }
});