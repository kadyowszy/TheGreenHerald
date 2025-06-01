document.addEventListener('DOMContentLoaded', () => {
    const headerUserAvatarImg = document.querySelector('header.page-header .user-avatar img');
    const mainUserAvatarUrl = 'https://placehold.co/40x40/1E4D2B/FFFFFF?text=U';
    if (headerUserAvatarImg && mainUserAvatarUrl) {
        headerUserAvatarImg.src = mainUserAvatarUrl;
    }

    const menuBtn = document.getElementById('menu-btn');
    const closeMenuBtn = document.getElementById('close-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            mobileMenu.classList.remove('hidden');
            mobileMenu.classList.add('visible');
            menuBtn.setAttribute('aria-expanded', 'true');
        });
    }

    if (closeMenuBtn && mobileMenu) {
        closeMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.remove('visible');
            mobileMenu.classList.add('hidden');
            if (menuBtn) {
                menuBtn.setAttribute('aria-expanded', 'false');
            }
        });
    }

    const newThreadModal = document.getElementById('newThreadModal');
    const modalOverlay = document.getElementById('modalOverlay');
    const openNewThreadBtn = document.querySelector('.new-thread-btn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const newThreadForm = document.getElementById('newThreadForm');
    const newThreadTitleInput = document.getElementById('newThreadTitle');
    const postsListContainer = document.querySelector('.posts-list');

    const modalFlairsContainer = document.getElementById('modalFlairsContainer');
    const hiddenFlairInput = document.getElementById('newThreadFlair');

    const flairClassMap = {
        'announcement': 'badge-announcement', 'mod post': 'badge-mod-post',
        'fluff/meme': 'badge-fluff-meme', 'events': 'badge-events',
        'guides/tips': 'badge-guides-tips', 'academics': 'badge-academics',
        'questions': 'badge-questions', 'hot': 'badge-hot', 'rant': 'badge-rant',
        'unrelated to cvsu': 'badge-unrelated', 'shady': 'badge-shady',
        'anon post': 'badge-anon-post', 'media': 'badge-media',
        'general': 'badge-questions', 'sticky': 'badge-sticky'
    };

    const getFlairClass = (flairText) => {
        const lowerFlairText = (flairText || 'general').toLowerCase().trim();
        return flairClassMap[lowerFlairText] || 'badge-questions';
    };

    const isPostSticky = (postData) => {
        if (postData && Array.isArray(postData.customBadges) && postData.customBadges.some(b => b.text && b.text.toLowerCase() === 'sticky')) return true;
        return postData && postData.isPinned === true;
    };

    const FORUM_DATA_PATH = '../json/forum_data.json';
    let originalPosts = [];
    let currentActiveFilterFlairText = null;

    function populateModalFlairBadges() {
        if (!modalFlairsContainer) return;

        const flairElements = document.querySelectorAll('.flairs-container .badge');
        const allowedFlairTexts = new Set();
        flairElements.forEach(badge => {
            const flairText = badge.textContent.trim();
            const lowerFlairText = flairText.toLowerCase();
            if (!['mod post', 'sticky', 'hot', 'announcement'].includes(lowerFlairText)) {
                allowedFlairTexts.add(flairText);
            }
        });

        modalFlairsContainer.innerHTML = '';

        allowedFlairTexts.forEach(text => {
            const flairBadge = document.createElement('span');
            flairBadge.className = `badge ${getFlairClass(text)} modal-flair-option`;
            flairBadge.textContent = text;
            flairBadge.dataset.value = text;
            flairBadge.setAttribute('role', 'checkbox');
            flairBadge.setAttribute('aria-checked', 'false');
            flairBadge.tabIndex = 0;

            flairBadge.addEventListener('click', () => toggleFlairSelection(flairBadge));
            flairBadge.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleFlairSelection(flairBadge);
                }
            });
            modalFlairsContainer.appendChild(flairBadge);
        });
    }

    function toggleFlairSelection(clickedBadgeElement) {
        const isSelected = clickedBadgeElement.classList.toggle('selected');
        clickedBadgeElement.setAttribute('aria-checked', isSelected.toString());
        updateHiddenFlairInput();
    }

    function updateHiddenFlairInput() {
        if (!hiddenFlairInput || !modalFlairsContainer) return;
        const selectedFlairElements = modalFlairsContainer.querySelectorAll('.modal-flair-option.selected');
        const selectedFlairValues = Array.from(selectedFlairElements).map(el => el.dataset.value);
        hiddenFlairInput.value = selectedFlairValues.join(',');
    }

    if (openNewThreadBtn && newThreadModal && modalOverlay) {
        openNewThreadBtn.addEventListener('click', () => {
            newThreadModal.classList.remove('hidden');
            newThreadModal.classList.add('visible');
            modalOverlay.classList.remove('hidden');
            modalOverlay.classList.add('visible');
            if (newThreadTitleInput) newThreadTitleInput.focus();
        });
    }

    const closeThreadModal = () => {
        if (newThreadModal && modalOverlay) {
            newThreadModal.classList.remove('visible');
            newThreadModal.classList.add('hidden');
            modalOverlay.classList.remove('visible');
            modalOverlay.classList.add('hidden');
        }
    };

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeThreadModal);
    if (modalOverlay) modalOverlay.addEventListener('click', closeThreadModal);

    function getAuthorDisplayDetails(postData, isSticky) {
        let displayAuthorName = postData.author;
        let displayAvatarChar = postData.avatarChar || (postData.author ? postData.author.charAt(0).toUpperCase() : 'U');
        let displayAvatarImageUrl = postData.avatarImageUrl;
        let authorAvatarClass = 'author-avatar';
        let isAnonymousPost = false;
        const anonFlairTextLower = 'anon post';

        if ((postData.flair && typeof postData.flair === 'string' && postData.flair.toLowerCase() === anonFlairTextLower) ||
            (Array.isArray(postData.flairs) && postData.flairs.some(f => f.toLowerCase() === anonFlairTextLower)) ||
            (Array.isArray(postData.customBadges) && postData.customBadges.some(cb => cb.text && cb.text.toLowerCase() === anonFlairTextLower))) {
            isAnonymousPost = true;
        }

        if (isAnonymousPost) {
            displayAuthorName = "Anonymous";
            displayAvatarChar = "?";
            displayAvatarImageUrl = null;
            authorAvatarClass += ' gray';
        } else if (postData.author === 'iamline' && isSticky) {
            // No 'gray' class added, uses default styling
        } else {
            authorAvatarClass += ' gray';
        }

        return { displayAuthorName, displayAvatarChar, displayAvatarImageUrl, authorAvatarClass };
    }

    function createPostElement(postData) {
        const article = document.createElement('article');
        article.className = 'post-card';
        const sticky = isPostSticky(postData);
        if (sticky) {
            article.classList.add('pinned-post');
        }
        article.setAttribute('data-post-id', postData.id);

        let badgesHTML = '';
        if (postData.flair && typeof postData.flair === 'string') {
            badgesHTML += `<span class="badge ${getFlairClass(postData.flair)}">${postData.flair.charAt(0).toUpperCase() + postData.flair.slice(1)}</span>`;
        }
        if (Array.isArray(postData.flairs)) {
            badgesHTML += postData.flairs.map(flairText => {
                return `<span class="badge ${getFlairClass(flairText)}">${flairText.charAt(0).toUpperCase() + flairText.slice(1)}</span>`;
            }).join('');
        }
        if (badgesHTML === '' && (!postData.flair && !postData.flairs)) {
            badgesHTML += `<span class="badge ${getFlairClass('General')}">General</span>`;
        }
        if (postData.customBadges && Array.isArray(postData.customBadges)) {
            badgesHTML += postData.customBadges.map(badgeInfo => {
                const badgeText = badgeInfo.text;
                const badgeClass = getFlairClass(badgeText);
                return `<span class="badge ${badgeClass}">${badgeText}</span>`;
            }).join('');
        }

        const { displayAuthorName, displayAvatarChar, displayAvatarImageUrl, authorAvatarClass } = getAuthorDisplayDetails(postData, sticky);

        let avatarContentHTML;
        if (displayAvatarImageUrl) {
            avatarContentHTML = `<img src="${displayAvatarImageUrl}" alt="${displayAuthorName} avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: inherit;">`;
        } else {
            avatarContentHTML = `<span>${displayAvatarChar}</span>`;
        }

        article.innerHTML = `
            <div class="post-content">
                ${sticky ? '<span class="post-pin-icon" aria-hidden="true">📌</span>' : ''}
                <div class="post-body">
                    <div class="post-badges">${badgesHTML}</div>
                    <h3 class="post-title"><a href="#" data-postid="${postData.id}">${postData.title}</a></h3>
                    <p class="post-text">${postData.content}</p>
                    <footer class="post-footer">
                        <div class="post-author">
                            <div class="${authorAvatarClass}" aria-hidden="true">${avatarContentHTML}</div>
                            <span class="author-name">${displayAuthorName}</span>
                            <span class="post-timestamp"><time datetime="${postData.datetime}">${postData.timeAgo}</time></span>
                        </div>
                        <div class="post-engagement">
                            <div class="engagement-item like-button">
                                <i class="fas fa-thumbs-up" aria-hidden="true"></i>
                                <span data-likes="${postData.likes}">${postData.likes} Like${postData.likes !== 1 ? 's' : ''}</span>
                            </div>
                            <div class="engagement-item reply-link">
                                ${postData.isLocked ? '<i class="fas fa-lock" aria-hidden="true"></i>' : ''}
                                <span class="replies-count">${postData.replies} Repl${postData.replies !== 1 ? 'ies' : 'y'}</span>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        `;
        addInteractivityToPost(article);
        return article;
    }

    function addInteractivityToPost(postElement) {
        const postId = postElement.getAttribute('data-post-id');
        const likeButtonContainer = postElement.querySelector('.like-button');

        if (likeButtonContainer) {
            const likeIcon = likeButtonContainer.querySelector('.fa-thumbs-up');
            const likesSpan = likeButtonContainer.querySelector('span[data-likes]');
            let currentLikes = parseInt(likesSpan.getAttribute('data-likes')) || 0;
            let isLiked = postElement.classList.contains('user-liked');

            if (isLiked) {
                likeIcon.style.color = 'var(--university-gold)';
            }

            likeButtonContainer.addEventListener('click', (event) => {
                event.preventDefault();
                if (isLiked) {
                    currentLikes--;
                    likeIcon.style.color = '';
                    postElement.classList.remove('user-liked');
                } else {
                    currentLikes++;
                    likeIcon.style.color = 'var(--university-gold)';
                    postElement.classList.add('user-liked');
                }
                isLiked = !isLiked;
                likesSpan.textContent = `${currentLikes} Like${currentLikes !== 1 ? 's' : ''}`;
                likesSpan.setAttribute('data-likes', currentLikes);
            });
        }

        const replyElement = postElement.querySelector('.reply-link');
        if (replyElement) {
            replyElement.addEventListener('click', (event) => {
                event.preventDefault();
                if (postElement.querySelector('.fa-lock')) {
                    alert(`Replies are locked for this post.`);
                } else {
                    window.location.href = `forumpost.html?id=${postId}`;
                }
            });
        }

        const postTitleLink = postElement.querySelector('.post-title a');
        if (postTitleLink) {
            postTitleLink.addEventListener('click', (event) => {
                event.preventDefault();
                const targetPostId = postTitleLink.getAttribute('data-postid');
                if (targetPostId) {
                    window.location.href = `forumpost.html?id=${targetPostId}`;
                }
            });
        }
    }

    function displayPosts(postsToDisplay) {
        if (!postsListContainer) {
            console.error("Posts list container not found for displayPosts.");
            return;
        }
        postsListContainer.innerHTML = '';

        if (postsToDisplay && postsToDisplay.length > 0) {
            const stickyPosts = postsToDisplay.filter(post => isPostSticky(post));
            const regularPosts = postsToDisplay.filter(post => !isPostSticky(post));

            stickyPosts.forEach(pd => postsListContainer.appendChild(createPostElement(pd)));
            if (stickyPosts.length > 0 && regularPosts.length > 0) {
                const hr = document.createElement('hr');
                postsListContainer.appendChild(hr);
            }
            regularPosts.forEach(pd => postsListContainer.appendChild(createPostElement(pd)));
        } else {
            postsListContainer.innerHTML = '<p>No posts match the current filter or no posts available.</p>';
        }
    }

    async function loadAndDisplayPosts() {
        if (!postsListContainer) {
            console.error("Posts list container not found.");
            return;
        }
        postsListContainer.innerHTML = '<p>Loading posts...</p>';

        try {
            const response = await fetch(FORUM_DATA_PATH);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const postsData = await response.json();

            originalPosts = postsData;
            currentActiveFilterFlairText = null;
            document.querySelectorAll('.flairs-container .badge.active-filter').forEach(b => b.classList.remove('active-filter'));

            displayPosts(originalPosts);

        } catch (e) {
            console.error("Load posts error:", e);
            postsListContainer.innerHTML = `<p>Error loading posts. ${e.message}</p>`;
            originalPosts = [];
        }
    }

    if (newThreadForm && postsListContainer) {
        newThreadForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const title = newThreadTitleInput.value.trim();
            const content = document.getElementById('newThreadContent').value.trim();
            const flairString = hiddenFlairInput.value;

            if (!flairString) {
                alert('Please select at least one flair.');
                if (modalFlairsContainer && modalFlairsContainer.firstChild) {
                    (modalFlairsContainer.firstChild).focus();
                }
                return;
            }
            if (!title) {
                alert('Please enter a title.');
                if (newThreadTitleInput) newThreadTitleInput.focus();
                return;
            }
            if (!content) {
                alert('Please enter content.');
                const contentEl = document.getElementById('newThreadContent');
                if (contentEl) contentEl.focus();
                return;
            }

            const selectedFlairsArray = flairString.split(',').filter(f => f.trim() !== '');
            const now = new Date();
            const postId = `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            const newPostData = {
                id: postId, title, content,
                flairs: selectedFlairsArray,
                customBadges: [], author: "arukuremu", avatarChar: "A", avatarImageUrl: "../assets/images/forums/pfp/arukuremu-pfp.jpg",
                datetime: now.toISOString(), timeAgo: "Just now",
                likes: 0, replies: 0, isLocked: false, comments: []
            };

            const stickyPostsCount = originalPosts.filter(isPostSticky).length;
            originalPosts.splice(stickyPostsCount, 0, newPostData);

            if (currentActiveFilterFlairText) {
                const filterTextLower = currentActiveFilterFlairText.toLowerCase();
                const filteredPosts = originalPosts.filter(post => {
                    if (post.flair && typeof post.flair === 'string' && post.flair.toLowerCase() === filterTextLower) return true;
                    if (Array.isArray(post.flairs) && post.flairs.some(f => f.toLowerCase() === filterTextLower)) return true;
                    if (Array.isArray(post.customBadges) && post.customBadges.some(cb => cb.text && cb.text.toLowerCase() === filterTextLower)) return true;
                    return false;
                });
                displayPosts(filteredPosts);
            } else {
                displayPosts(originalPosts);
            }

            if (newThreadForm) newThreadForm.reset();
            if (hiddenFlairInput) hiddenFlairInput.value = "";
            if (modalFlairsContainer) {
                modalFlairsContainer.querySelectorAll('.modal-flair-option.selected').forEach(flair => {
                    flair.classList.remove('selected');
                    flair.setAttribute('aria-checked', 'false');
                });
            }
            closeThreadModal();
        });
    }

    const flairSidebarBadges = document.querySelectorAll('.flairs-container .badge');
    flairSidebarBadges.forEach(badge => {
        badge.addEventListener('click', () => {
            const clickedFlairText = badge.textContent.trim();

            flairSidebarBadges.forEach(b => b.classList.remove('active-filter'));

            if (currentActiveFilterFlairText === clickedFlairText) {
                currentActiveFilterFlairText = null;
                displayPosts(originalPosts);
            } else {
                currentActiveFilterFlairText = clickedFlairText;
                badge.classList.add('active-filter');

                const filterTextLower = currentActiveFilterFlairText.toLowerCase();
                const filteredPosts = originalPosts.filter(post => {
                    if (post.flair && typeof post.flair === 'string' && post.flair.toLowerCase() === filterTextLower) return true;
                    if (Array.isArray(post.flairs) && post.flairs.some(f => f.toLowerCase() === filterTextLower)) return true;
                    if (Array.isArray(post.customBadges) && post.customBadges.some(cb => cb.text && cb.text.toLowerCase() === filterTextLower)) return true;
                    return false;
                });
                displayPosts(filteredPosts);
            }
        });
    });

    const searchForm = document.querySelector('form[role="search"].search-wrapper');
    if (searchForm) {
        searchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const searchInputInForm = searchForm.querySelector('.search-input');
            const searchTerm = searchInputInForm ? searchInputInForm.value.trim() : "";
            if (searchTerm) {
                alert('Nothing yet, demo mode.');
            } else {
                alert('Enter search term.');
            }
        });
    }

    const forumHeaderUserAvatarDiv = document.querySelector('.forum-header-right .user-avatar');
    if (forumHeaderUserAvatarDiv) {
        forumHeaderUserAvatarDiv.addEventListener('click', () => {
            window.location.href = 'profile.html';
        });
    }
    
    const bellIcon = document.querySelector('.bell-icon');
    if (bellIcon) {
        bellIcon.addEventListener('click', () => alert('Nothing yet, demo mode.'));
    }

    const headerAvatarDiv = document.querySelector('header.page-header .user-avatar'); // Renamed to avoid conflict
    if (headerAvatarDiv) { // Check specifically for this header avatar
        headerAvatarDiv.addEventListener('click', () => alert('Nothing yet, demo mode.'));
    }

    const trendingItemLinks = document.querySelectorAll('.trending-item a');
    trendingItemLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            if (link.getAttribute('href') === '#') {
                event.preventDefault();
                alert('Nothing yet, demo mode.');
            }
        });
    });

    populateModalFlairBadges();
    loadAndDisplayPosts();
});