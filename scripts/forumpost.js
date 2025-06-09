document.addEventListener('DOMContentLoaded', () => {
    const postDetailWrapper = document.getElementById('post-detail-wrapper');
    const loadingMessage = document.getElementById('loading-message');
    const errorMessage = document.getElementById('error-message');
    const commentsListContainer = document.getElementById('comments-list');
    const commentFormContainer = document.getElementById('comment-form-container');

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
        'general': 'badge-default',
        'urgent': 'badge-urgent',
        'lost & found': 'badge-lost-found',
        'sticky': 'badge-sticky'
    };
    const getFlairClass = (flairText) => {
        const lowerFlairText = (flairText || '').toLowerCase().trim();
        return flairClassMap[lowerFlairText] || 'badge-default';
    };

    const FORUM_DATA_PATH = '../json/forum_data.json';

    async function fetchAllForumData() {
        try {
            const response = await fetch(FORUM_DATA_PATH);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} while fetching ${FORUM_DATA_PATH}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Could not fetch forum data:", error);
            throw error;
        }
    }

    async function fetchPostById(postId) {
        try {
            const allPosts = await fetchAllForumData();
            return allPosts.find(p => String(p.id) === String(postId)) || null;
        } catch (error) {
            throw error;
        }
    }

    function createCommentHTML(comment) {
        let commentTimestamp = comment.timestamp || 'just now';
        if (comment.timestamp && new Date(comment.timestamp).toString() !== "Invalid Date" && isNaN(comment.timestamp)) {
            try {
                const date = new Date(comment.timestamp);
                if (!isNaN(date)) {
                    commentTimestamp = date.toLocaleString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    });
                }
            } catch(e) {}
        }

        const authorName = comment.author || 'Anonymous';

        return `
            <div class="comment-item">
                <div class="comment-meta">
                    <a href="#" class="comment-author-name">${authorName}</a>
                    <span class="comment-timestamp">• ${commentTimestamp}</span>
                </div>
                <div class="comment-body">
                    <p>${comment.text ? comment.text.replace(/\n/g, '<br>') : ''}</p>
                </div>
                <div class="comment-actions">
                    <button class="comment-action-btn" aria-label="Like"><i class="fas fa-thumbs-up"></i></button>
                    <span class="comment-votes">0</span>
                    <button class="comment-action-btn" aria-label="Dislike"><i class="fas fa-thumbs-down"></i></button>
                    <button class="comment-action-btn reply-btn"><i class="fas fa-reply"></i> Reply</button>
                </div>
            </div>
        `;
    }
    
    function handleAddComment(event) {
        event.preventDefault();
        const commentTextarea = document.getElementById('new-comment-text');
        const commentText = commentTextarea.value.trim();

        if (!commentText) {
            alert("Comment cannot be empty!");
            return;
        }

        const newComment = {
            author: "CurrentUser",
            text: commentText,
            timestamp: new Date().toISOString(),
            authorAvatarUrl: null
        };

        const commentHTML = createCommentHTML(newComment);
        
        const noCommentsMsg = commentsListContainer.querySelector('p');
        if (noCommentsMsg && noCommentsMsg.textContent.includes("No comments yet")) {
            commentsListContainer.innerHTML = '';
        }
        
        commentsListContainer.insertAdjacentHTML('beforeend', commentHTML);
        commentTextarea.value = '';

        console.log("New comment added (to current view only):", newComment);
        alert("Comment posted! (Note: This comment is only visible in your current session and will not be saved permanently.)");
    }

    function renderCommentForm(postData) { 
        if (!commentFormContainer) return;

        if (postData && postData.isLocked) {
            commentFormContainer.innerHTML = `
                <div class="comment-form-locked">
                    <p>Comments are closed for this post.</p>
                </div>
            `;
        } else {
            commentFormContainer.innerHTML = `
                <form class="comment-form" id="comment-form">
                    <label for="new-comment-text">Add a comment:</label>
                    <textarea id="new-comment-text" name="new-comment-text" rows="3" placeholder="What are your thoughts?" required></textarea>
                    <button type="submit">Post Comment</button>
                </form>
            `;
            const form = document.getElementById('comment-form');
            if (form) {
                form.addEventListener('submit', handleAddComment);
            }
        }
    }

    function displayPost(postData) {
        if (!postDetailWrapper) {
            console.error("Element with ID 'post-detail-wrapper' not found.");
            if (loadingMessage) loadingMessage.style.display = 'none';
            if (errorMessage) {
                    errorMessage.style.display = 'block';
                    errorMessage.textContent = "Page structure error.";
            }
            return;
        }

        if (!postData) {
            if (loadingMessage) loadingMessage.style.display = 'none';
            if (errorMessage) {
                errorMessage.style.display = 'block';
                const currentPostId = urlParams.get('id') || "UNKNOWN";
                errorMessage.textContent = `Could not load post. ID (${currentPostId}) might be incorrect or post doesn't exist.`;
            }
            postDetailWrapper.innerHTML = '';
            return;
        }

        if (loadingMessage) loadingMessage.style.display = 'none';
        if (errorMessage) errorMessage.style.display = 'none';

        const pinIconHTML = postData.isPinned ? `<i class="fas fa-thumbtack post-pin-icon" title="Pinned Post"></i>` : '';
        
        let formattedTimestamp = postData.timeAgo || 'some time ago';
        if (postData.datetime) {
            try {
                const date = new Date(postData.datetime);
                if (!isNaN(date)) {
                    formattedTimestamp = date.toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    });
                }
            } catch (e) {}
        }
        
        let allBadges = [];
        if (postData.flair) {
            allBadges.push({ text: postData.flair }); 
        }
        const customOrTags = postData.customBadges || postData.tags;
        if (customOrTags && customOrTags.length > 0) {
            customOrTags.forEach(item => {
                if (typeof item === 'string') {
                    allBadges.push({ text: item });
                } else if (item && item.text) {
                    allBadges.push({ text: item.text });
                }
            });
        }

        let tagsHTML = '';
        if (allBadges.length > 0) {
            tagsHTML = allBadges.map(badgeObj => {
                const badgeText = badgeObj.text;
                if (!badgeText) return '';
                const badgeClass = getFlairClass(badgeText);
                return `<span class="badge ${badgeClass}">${badgeText.charAt(0).toUpperCase() + badgeText.slice(1)}</span>`;
            }).join('');
        }

        const voteCount = postData.likes !== undefined ? postData.likes : (postData.votes !== undefined ? postData.votes : 0);

        const postHTML = `
            <article class="forum-post-card">
                <div class="vote-section">
                    <button class="vote-btn upvote" aria-label="Like"><i class="fas fa-thumbs-up"></i></button>
                    <span class="vote-count">${voteCount}</span>
                    <button class="vote-btn downvote" aria-label="Dislike"><i class="fas fa-thumbs-down"></i></button>
                </div>
                <div class="post-main-area">
                    <div class="post-meta-header">
                        ${pinIconHTML}
                        <span class="posted-by">
                            Posted by 
                            <a href="#" class="author-link">${postData.author || 'Anonymous'}</a>
                        </span>
                        <span class="post-timestamp">• ${formattedTimestamp}</span>
                    </div>
                    <h2 class="post-title">${postData.title || 'Untitled Post'}</h2>
                    ${postData.imageUrl ? `<img src="${postData.imageUrl}" alt="${postData.title || 'Post image'}" class="post-image">` : ''}
                    <hr>
                    <div class="post-content">
                        ${postData.content ? postData.content.replace(/\n/g, '<br>') : 'No content.'}
                    </div>
                    ${tagsHTML ? `<div class="post-badges">${tagsHTML}</div>` : ''}
                    <div class="post-actions">
                        <button class="action-btn share-btn">
                            <i class="fas fa-share"></i>
                            <span>Share</span>
                        </button>
                        <button class="action-btn save-btn">
                            <i class="fas fa-bookmark"></i>
                            <span>Save</span>
                        </button>
                        ${postData.isLocked ? '<span class="action-btn locked-indicator"><i class="fas fa-lock"></i> Locked</span>' : ''}
                        <button class="action-btn more-options-btn">
                            <i class="fas fa-ellipsis-h" aria-label="More options"></i>
                        </button>
                    </div>
                </div>
            </article>
        `;
        postDetailWrapper.innerHTML = postHTML;
        
        renderCommentForm(postData);

        if (commentsListContainer) {
            if (postData.comments && postData.comments.length > 0) {
                commentsListContainer.innerHTML = postData.comments.map(comment => createCommentHTML(comment)).join('');
            } else {
                commentsListContainer.innerHTML = '<p>No comments yet for this post.</p>';
            }
        } else {
            console.warn("Element with ID 'comments-list' not found.");
        }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (postId) {
        fetchPostById(postId)
            .then(postData => {
                displayPost(postData);
            })
            .catch(error => {
                console.error("Error fetching or displaying post:", error);
                if (loadingMessage) loadingMessage.style.display = 'none';
                if (errorMessage) {
                    errorMessage.style.display = 'block';
                    errorMessage.textContent = 'An error occurred. Check console.';
                }
                if (postDetailWrapper) postDetailWrapper.innerHTML = '';
            });
    } else {
        if (loadingMessage) loadingMessage.style.display = 'none';
        if (errorMessage) {
            errorMessage.style.display = 'block';
            errorMessage.textContent = 'No post ID provided in URL.';
        }
            if (postDetailWrapper) postDetailWrapper.innerHTML = '';
    }

    const menuBtn = document.getElementById('menu-btn');
    const mobileMenuPanel = document.getElementById('mobile-menu');

    if (menuBtn && mobileMenuPanel) {
        const desktopNav = document.querySelector('.desktop-nav');
        if (desktopNav && mobileMenuPanel.children.length === 0) { 
            mobileMenuPanel.innerHTML = `
                <button id="close-menu-btn" class="close-menu-button" aria-label="Close menu"><i class="fas fa-times fa-lg"></i></button>
                <nav class="mobile-nav">
                    ${desktopNav.innerHTML}
                </nav>
            `;
        }
        
        const closeMenuBtn = document.getElementById('close-menu-btn');

        menuBtn.addEventListener('click', () => {
            const isExpanded = menuBtn.getAttribute('aria-expanded') === 'true' || false;
            menuBtn.setAttribute('aria-expanded', String(!isExpanded));
            mobileMenuPanel.classList.toggle('visible');
            mobileMenuPanel.classList.toggle('hidden');
        });

        if (closeMenuBtn) {
            closeMenuBtn.addEventListener('click', () => {
                menuBtn.setAttribute('aria-expanded', 'false');
                mobileMenuPanel.classList.remove('visible');
                mobileMenuPanel.classList.add('hidden');
            });
        }
    }
});