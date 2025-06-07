document.addEventListener('DOMContentLoaded', () => {
    const headerUserAvatarImg = document.querySelector('header.page-header .user-avatar img');
    const mainUserAvatarUrl = 'https://placehold.co/40x40/1E4D2B/FFFFFF?text=U';
    if (headerUserAvatarImg && mainUserAvatarUrl) {
        headerUserAvatarImg.src = mainUserAvatarUrl;
    }

    const menuBtn = document.getElementById('menu-btn');
    const closeBtn = document.getElementById('close-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuBtn && closeBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            mobileMenu.classList.remove('hidden');
            mobileMenu.classList.add('visible');
            menuBtn.setAttribute('aria-expanded', 'true');
        });

        closeBtn.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
            mobileMenu.classList.remove('visible');
            menuBtn.setAttribute('aria-expanded', 'false');
        });
    } else {
        console.warn('Mobile menu elements not found.');
    }

    const followButton = document.querySelector('.edit-profile-btn');
    if (followButton) {
        let isFollowing = false;

        followButton.addEventListener('click', () => {
            isFollowing = !isFollowing;
            if (isFollowing) {
                followButton.textContent = 'Edit Profile';
                followButton.classList.add('following');
                alert('Nothing yet, demo mode.');
            } else {
                followButton.textContent = 'Edit Profile';
                followButton.classList.remove('following');
                alert('Nothing yet, demo mode.');
            }
        });
    } else {
        console.warn('Edit Profile/Follow button not found.');
    }

    const likeButtons = document.querySelectorAll('.action-item-profile.like-button');
    likeButtons.forEach(button => {
        let liked = button.getAttribute('aria-pressed') === 'true';
        const countSpan = button.querySelector('span[data-likes]');
        let currentLikes = countSpan ? parseInt(countSpan.dataset.likes, 10) : 0;

        if (!countSpan) {
            console.warn('Like count span not found for a like button:', button);
            return;
        }

        if (liked) {
            button.classList.add('liked');
            const thumbsUpIcon = button.querySelector('i.fas.fa-thumbs-up');
            if (thumbsUpIcon) {
                thumbsUpIcon.style.color = 'var(--university-gold)';
            }
        }

        button.addEventListener('click', (event) => {
            event.preventDefault();
            liked = !liked;
            button.setAttribute('aria-pressed', liked.toString());
            const thumbsUpIcon = button.querySelector('i.fas.fa-thumbs-up');

            if (liked) {
                currentLikes++;
                if (thumbsUpIcon) {
                    thumbsUpIcon.style.color = 'var(--university-gold)';
                }
                button.classList.add('liked');
            } else {
                currentLikes--;
                if (thumbsUpIcon) {
                    thumbsUpIcon.style.color = '';
                }
                button.classList.remove('liked');
            }
            countSpan.textContent = `${currentLikes} Like${currentLikes !== 1 ? 's' : ''}`;
            countSpan.dataset.likes = currentLikes;
        });
    });

    let activePopup = null;

    function closeActivePopup() {
        if (activePopup) {
            activePopup.remove();
            activePopup = null;
        }
    }

    document.addEventListener('click', (event) => {
        if (activePopup && !activePopup.contains(event.target)) {
            const isToggleButton = event.target.closest('.more-icon-profile, .banner-bell-button');
            if (!isToggleButton) {
                closeActivePopup();
            }
        }
    });

    function createPopup(targetElement, contentItems, title = null) {
        closeActivePopup();

        const popup = document.createElement('div');
        popup.className = 'dynamic-popup';

        if (title) {
            const titleElement = document.createElement('h5');
            titleElement.textContent = title;
            popup.appendChild(titleElement);
        }

        const list = document.createElement('ul');
        contentItems.forEach(item => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = item.href || '#';
            link.textContent = item.text;

            link.addEventListener('click', (e) => {
                if (item.href === '#') {
                    e.preventDefault();
                }
                if (item.action) {
                    item.action();
                }
                closeActivePopup();
            });
            listItem.appendChild(link);
            list.appendChild(listItem);
        });

        popup.appendChild(list);
        document.body.appendChild(popup);
        activePopup = popup;

        const rect = targetElement.getBoundingClientRect();
        popup.style.top = `${rect.bottom + window.scrollY + 5}px`;
        
        const popupWidth = popup.offsetWidth;
        if (rect.left + popupWidth > window.innerWidth - 10) {
            popup.style.left = `${rect.right + window.scrollX - popupWidth}px`;
        } else {
            popup.style.left = `${rect.left + window.scrollX}px`;
        }

        popup.addEventListener('click', event => event.stopPropagation());
        return popup;
    }

    const moreOptionsButtons = document.querySelectorAll('.more-icon-profile');
    moreOptionsButtons.forEach((button, index) => {
        button.id = `more-options-btn-${index}`;
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            const postCard = button.closest('.post-card-profile');
            const postTitleElement = postCard?.querySelector('.post-title-profile a');
            const postTitle = postTitleElement ? postTitleElement.textContent : 'this post';
            const authorNameElement = postCard?.querySelector('.author-name-profile');
            const authorName = authorNameElement ? authorNameElement.textContent : 'user';

            if (activePopup && activePopup.dataset.owner === button.id) {
                closeActivePopup();
            } else {
                const menuItems = [
                    { text: 'Copy link to post', action: () => {
                        navigator.clipboard.writeText(postTitleElement ? postTitleElement.href : window.location.href)
                            .then(() => showCustomMessage('Link copied to clipboard!'))
                            .catch(err => showCustomMessage('Failed to copy link.'));
                        }
                    },
                    { text: `Mute @${authorName}`, action: () => showCustomMessage(`User @${authorName} muted (mock).`) },
                    { text: `Block @${authorName}`, action: () => showCustomMessage(`User @${authorName} blocked (mock).`) },
                    { text: 'Embed Post', action: () => showCustomMessage('Embed code (mock).') },
                    { text: 'Report Post', action: () => showCustomMessage(`Reporting "${postTitle}" (mock).`) }
                ];
                const newPopup = createPopup(button, menuItems);
                newPopup.dataset.owner = button.id;
            }
        });
    });

    const notificationBell = document.querySelector('.banner-bell-button');
    if (notificationBell) {
        notificationBell.addEventListener('click', (event) => {
            event.stopPropagation();

            if (activePopup && activePopup.dataset.owner === 'notifications-popup') {
                closeActivePopup();
            } else {
                const notificationItems = [
                    { text: 'gabbbb liked your post: "PHAINON LEAKS..."', action: () => {} },
                    { text: 'smllnce commented: "Pano po?"', action: () => {} },
                    { text: 'New Announcement: Check out the latest updates!', action: () => {} },
                    { text: 'You have 3 new followers', action: () => {} }
                ];
                const newPopup = createPopup(notificationBell, notificationItems, "Notifications");
                newPopup.dataset.owner = 'notifications-popup';
            }
        });
    } else {
        console.warn('Notification bell button not found.');
    }

    let messageBoxTimeoutHide, messageBoxTimeoutRemove;
    function showCustomMessage(message) {
        clearTimeout(messageBoxTimeoutHide);
        clearTimeout(messageBoxTimeoutRemove);

        let messageBox = document.getElementById('custom-message-box');
        if (!messageBox) {
            messageBox = document.createElement('div');
            messageBox.id = 'custom-message-box';
            document.body.appendChild(messageBox);
        }
        messageBox.textContent = message;
        messageBox.classList.add('visible');
        messageBox.style.display = '';

        messageBoxTimeoutHide = setTimeout(() => {
            messageBox.classList.remove('visible');
        }, 2500);

        messageBoxTimeoutRemove = setTimeout(() => {
            if (messageBox) {
                messageBox.style.display = 'none';
            }
        }, 2800);
    }
});