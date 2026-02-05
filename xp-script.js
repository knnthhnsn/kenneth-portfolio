/* Minimal XP Sound System */
const XP_CLICK = "https://cdnjs.cloudflare.com/ajax/libs/ion-sound/3.0.7/sounds/button_tiny.mp3";

window.playSound = function () {
    const vol = document.getElementById('volume-icon');
    if (vol && !vol.classList.contains('active')) return;

    if (window.audioUnlocked) {
        const audio = new Audio(XP_CLICK);
        audio.volume = 0.4;
        audio.play().catch(() => { });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    initClock();
    initStartMenu();
    initDesktopIcons();
    initWindowSystem();

    // Unlock audio context on interaction
    const unlockAudio = () => {
        window.audioUnlocked = true;
        document.body.removeEventListener('click', unlockAudio);
        new Audio(XP_CLICK).play().catch(() => { });
    };
    document.body.addEventListener('click', unlockAudio);

    // Global click sound
    document.addEventListener('mousedown', () => window.playSound());

    // Connectivity for Start Menu and Quick Launch
    document.querySelectorAll('.menu-item[data-window]').forEach(item => {
        item.addEventListener('click', () => {
            const winId = item.getAttribute('data-window');
            openWindowById(winId);
            document.getElementById('start-menu').classList.add('hidden');
        });
    });

    document.querySelectorAll('.ql-icon[data-window]').forEach(icon => {
        icon.addEventListener('click', () => {
            const winId = icon.getAttribute('data-window');
            openWindowById(winId);
        });
    });

    document.getElementById('show-desktop').addEventListener('click', () => {
        Object.keys(windows).forEach(id => minimizeWindow(id));
    });

    const volIcon = document.getElementById('volume-icon');
    if (volIcon) {
        volIcon.onclick = () => {
            volIcon.classList.toggle('active');
            const isActive = volIcon.classList.contains('active');
            volIcon.querySelector('img').src = isActive ?
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Cpath d='M2 6v4h3l4 4V2L5 6H2zM12 8c0-2-1-3-2-4v8c1-1 2-2 2-4z' fill='white'/%3E%3C/svg%3E" :
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Cpath d='M2 6v4h3l4 4V2L5 6H2z' fill='gray'/%3E%3C/svg%3E";
        };
    }

    const infoIcon = document.getElementById('info-icon');
    if (infoIcon) {
        infoIcon.onclick = () => {
            alert("XP Audio: Click anywhere to unlock sounds. Toggle volume in taskbar.");
        };
    }
});

/* Clock Functionality */
function initClock() {
    const clockElement = document.getElementById('taskbar-clock');
    function updateTime() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' });
        clockElement.textContent = timeStr;
    }
    updateTime();
    setInterval(updateTime, 1000);
}

/* Start Menu Toggle */
function initStartMenu() {
    const startBtn = document.getElementById('start-button');
    const startMenu = document.getElementById('start-menu');

    startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        startMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
        startMenu.classList.add('hidden');
    });

    startMenu.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    document.getElementById('shut-down-btn').addEventListener('click', () => {
        document.getElementById('bsod').classList.remove('hidden');
    });
}

/* ========================================
   DESKTOP ICONS & DRAG LOGIC
   ======================================== */
const GRID_SIZE_X = 90;
const GRID_SIZE_Y = 100; // Unified to 100px for consistency

// Global Auto-Arrange Function (XP Style: Top-Down, Left-to-Right)
window.arrangeIcons = function () {
    const icons = Array.from(document.querySelectorAll('.desktop-icon'));
    const taskbarHeight = 48;
    const offset = 15; // Increased to 15px to match gap (90-75=15)

    // Dynamic row calculation based on window height
    const availableH = window.innerHeight - taskbarHeight - offset;
    const maxRows = Math.floor(availableH / GRID_SIZE_Y) || 1;

    icons.forEach((icon, i) => {
        // Column-Major calculation
        const col = Math.floor(i / maxRows);
        const row = i % maxRows;

        icon.style.left = (offset + col * GRID_SIZE_X) + 'px';
        icon.style.top = (offset + row * GRID_SIZE_Y) + 'px';

        // Ensure standard draggable is attached
        if (window.makeIconDraggable) window.makeIconDraggable(icon);
    });
};

window.initDesktopIcons = function () {
    // Initial arrangement
    window.arrangeIcons();

    // Deselect on desktop click
    const desktop = document.getElementById('desktop');
    if (desktop) {
        desktop.addEventListener('click', (e) => {
            if (e.target.id === 'desktop' || e.target.id === 'icon-grid') {
                document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
            }
        });
    }

    // Re-arrange on resize to keep grid valid
    window.addEventListener('resize', window.arrangeIcons);
};

window.makeIconDraggable = function (elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    // Ensure absolute positioning for drag
    if (elmnt.style.position !== 'absolute') {
        elmnt.style.position = 'absolute';
    }

    elmnt.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;

        // Selection logic
        document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
        elmnt.classList.add('selected');
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        if (window.snapToGrid) window.snapToGrid(elmnt);
    }
};

window.snapToGrid = function (element) {
    const desktop = document.getElementById('desktop');
    const maxX = desktop.clientWidth - 75;
    const maxY = desktop.clientHeight - 75;
    const offset = 15; // Symmetric offset matching arrangeIcons

    let left = parseInt(element.style.left || 0);
    let top = parseInt(element.style.top || 0);

    let gridCol = Math.round((left - offset) / GRID_SIZE_X);
    let gridRow = Math.round((top - offset) / GRID_SIZE_Y);

    if (gridCol < 0) gridCol = 0;
    if (gridRow < 0) gridRow = 0;

    let snappedLeft = offset + (gridCol * GRID_SIZE_X);
    let snappedTop = offset + (gridRow * GRID_SIZE_Y);

    snappedLeft = Math.max(offset, Math.min(snappedLeft, maxX));
    snappedTop = Math.max(offset, Math.min(snappedTop, maxY));

    element.style.left = snappedLeft + "px";
    element.style.top = snappedTop + "px";
};

// ==========================================
// FINAL LAYOUT FIX: MUTATION OBSERVER
// ==========================================
// Automatically re-arrange icons if new ones are added
const iconGrid = document.getElementById('icon-grid');
if (iconGrid) {
    const observer = new MutationObserver((mutations) => {
        let shouldArrange = false;
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Check if added node is an icon or contains one
                mutation.addedNodes.forEach(node => {
                    if (node.classList && node.classList.contains('desktop-icon')) {
                        shouldArrange = true;
                    }
                });
            }
        });

        if (shouldArrange && window.arrangeIcons) {
            if (window.arrangeTimeout) clearTimeout(window.arrangeTimeout);
            window.arrangeTimeout = setTimeout(() => {
                window.arrangeIcons();
            }, 50);
        }
    });

    observer.observe(iconGrid, { childList: true });
}

// Ensure initial run
window.addEventListener('load', () => {
    if (window.arrangeIcons) setTimeout(window.arrangeIcons, 500);
});


document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.getElementById('bsod').classList.add('hidden');
    }
});

/* Window System */
let zIndexCounter = 100;
const windows = {};

function initWindowSystem() {
    const container = document.getElementById('windows-container');
    const taskbarWins = document.getElementById('taskbar-windows');

    window.createWindow = function (id, title, icon, content) {
        if (windows[id]) {
            focusWindow(id);
            return;
        }

        const win = document.createElement('div');
        win.className = 'window active';
        win.id = `win-${id}`;
        win.style.zIndex = ++zIndexCounter;
        win.style.top = (100 + (Object.keys(windows).length * 20)) + 'px';
        win.style.left = (100 + (Object.keys(windows).length * 20)) + 'px';
        win.style.width = '450px';
        win.style.height = '350px';

        win.innerHTML = `
            <div class="title-bar">
                <div class="title-bar-text">
                    <img src="${icon}">
                    <span>${title}</span>
                </div>
                <div class="title-bar-controls">
                    <div class="control-btn btn-min" onclick="minimizeWindow('${id}')">_</div>
                    <div class="control-btn btn-max" onclick="maximizeWindow('${id}')">□</div>
                    <div class="control-btn btn-close" onclick="closeWindow('${id}')">X</div>
                </div>
            </div>
            <div class="window-content" style="padding:0;">
                ${content}
            </div>
        `;

        container.appendChild(win);
        windows[id] = win;

        const tbBtn = document.createElement('div');
        tbBtn.className = 'taskbar-item active';
        tbBtn.id = `tb-${id}`;
        tbBtn.innerHTML = `<img src="${icon}"> <span>${title}</span>`;
        tbBtn.onclick = () => toggleWindow(id);
        taskbarWins.appendChild(tbBtn);

        makeDraggable(win);
        makeResizable(win);
        focusWindow(id);
        playSound('window-open-sound');

        // Clippy Reactivity
        if (window.clippySpeak) {
            const comments = {
                'pinball': { text: "Oh, Pinball! Did you know my high score is 1,234,000?", audio: "sounds/clippy/pinball.mp3" },
                'paint': { text: "Drawing something for the portfolio? I can help you with shapes!", audio: "sounds/clippy/paint.mp3" },
                'minesweeper': { text: "Don't click the mines! (I've been there...)", audio: "sounds/clippy/minesweeper.mp3" },
                'search': { text: "Rover is a good boy, isn't he?", audio: "sounds/clippy/search.mp3" },
                'ie': { text: "Looking for more projects? Check the favorites sidebar!", audio: "sounds/clippy/ie.mp3" }
            };
            if (comments[id]) window.clippySpeak(comments[id].text, comments[id].audio);
        }
    };

    window.focusWindow = function (id) {
        Object.values(windows).forEach(w => {
            w.classList.remove('active');
            w.classList.add('inactive');
        });
        const win = windows[id];
        if (win) {
            win.classList.add('active');
            win.classList.remove('inactive');
            win.style.zIndex = ++zIndexCounter;
            win.classList.remove('hidden');

            document.querySelectorAll('.taskbar-item').forEach(b => b.classList.remove('active'));
            const tbBtn = document.getElementById(`tb-${id}`);
            if (tbBtn) tbBtn.classList.add('active');
        }
    };

    window.closeWindow = function (id) {
        const win = windows[id];
        if (win) {
            win.remove();
            delete windows[id];
            const tbBtn = document.getElementById(`tb-${id}`);
            if (tbBtn) tbBtn.remove();
            playSound('window-close-sound');
        }
    };

    window.minimizeWindow = function (id) {
        const win = windows[id];
        if (win) {
            win.classList.add('hidden');
            const tbBtn = document.getElementById(`tb-${id}`);
            if (tbBtn) tbBtn.classList.remove('active');
        }
    };

    window.toggleWindow = function (id) {
        const win = windows[id];
        if (!win) return;
        if (win.classList.contains('hidden') || !win.classList.contains('active')) {
            focusWindow(id);
        } else {
            minimizeWindow(id);
        }
    };
}

function makeDraggable(el) {
    const titleBar = el.querySelector('.title-bar');
    if (!titleBar) return; // Exit if no title bar
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    titleBar.onmousedown = (e) => {
        e = e || window.event;
        e.preventDefault();
        focusWindow(el.id.replace('win-', ''));
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = () => { document.onmouseup = null; document.onmousemove = null; };
        document.onmousemove = (moveE) => {
            moveE = moveE || window.event;
            moveE.preventDefault();
            pos1 = pos3 - moveE.clientX;
            pos2 = pos4 - moveE.clientY;
            pos3 = moveE.clientX;
            pos4 = moveE.clientY;
            el.style.top = (el.offsetTop - pos2) + "px";
            el.style.left = (el.offsetLeft - pos1) + "px";
        };
    };
}

function makeResizable(win) {
    const resizers = ['resizer-r', 'resizer-b', 'resizer-rb'];
    resizers.forEach(rc => {
        const div = document.createElement('div');
        div.className = `resizer ${rc}`;
        win.appendChild(div);
        div.onmousedown = (e) => {
            e.preventDefault(); e.stopPropagation();
            focusWindow(win.id.replace('win-', ''));
            const startX = e.clientX; const startY = e.clientY;
            const startW = parseInt(window.getComputedStyle(win).width);
            const startH = parseInt(window.getComputedStyle(win).height);
            function onMove(me) {
                if (rc.includes('r')) win.style.width = (startW + me.clientX - startX) + 'px';
                if (rc.includes('b')) win.style.height = (startH + me.clientY - startY) + 'px';
            }
            function onUp() { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        };
    });
}

window.maximizeWindow = function (id) {
    const win = windows[id];
    if (win) {
        if (win.dataset.maximized === 'true') {
            win.style.top = win.dataset.oldTop; win.style.left = win.dataset.oldLeft;
            win.style.width = win.dataset.oldWidth; win.style.height = win.dataset.oldHeight;
            win.dataset.maximized = 'false';
        } else {
            win.dataset.oldTop = win.style.top; win.dataset.oldLeft = win.style.left;
            win.dataset.oldWidth = win.style.width; win.dataset.oldHeight = win.style.height;
            win.style.top = '0'; win.style.left = '0'; win.style.width = '100vw';
            win.style.height = 'calc(100vh - var(--taskbar-height))';
            win.dataset.maximized = 'true';
        }
    }
};

/* Desktop Icons & Dragging */
function initDesktopIcons() {
    const iconGrid = document.getElementById('icon-grid');
    const icons = iconGrid.querySelectorAll('.desktop-icon');
    const taskbarHeight = 40; // Taskbar height in pixels
    const iconHeight = 90; // Height per icon slot
    const availableHeight = window.innerHeight - taskbarHeight - 20; // 20px padding
    const maxIconsPerColumn = Math.floor(availableHeight / iconHeight);

    icons.forEach((icon, index) => {
        icon.style.position = 'absolute';
        const column = Math.floor(index / maxIconsPerColumn);
        const row = index % maxIconsPerColumn;
        icon.style.left = (column * 90 + 10) + 'px';
        icon.style.top = (row * iconHeight + 10) + 'px';
        makeIconDraggable(icon);

        icon.addEventListener('dblclick', () => openWindowById(icon.getAttribute('data-window')));
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
            icon.classList.add('selected');
        });
    });

    document.getElementById('desktop').addEventListener('click', () => {
        document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
    });
}

function makeIconDraggable(icon) {
    let p1 = 0, p2 = 0, p3 = 0, p4 = 0;
    const GRID = 90;
    icon.onmousedown = (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        p3 = e.clientX; p4 = e.clientY;
        document.onmouseup = () => {
            document.onmouseup = null; document.onmousemove = null;
            // Snap to grid
            let snappedLeft = Math.round(icon.offsetLeft / 90) * 90 + 10;
            let snappedTop = Math.round(icon.offsetTop / 90) * 90 + 10;
            // Constrain to not overlap taskbar (40px height)
            const maxTop = window.innerHeight - 40 - 90; // taskbar height - icon height
            if (snappedTop > maxTop) snappedTop = maxTop;
            if (snappedTop < 10) snappedTop = 10;
            if (snappedLeft < 10) snappedLeft = 10;
            icon.style.left = snappedLeft + 'px';
            icon.style.top = snappedTop + 'px';
        };
        document.onmousemove = (me) => {
            me.preventDefault();
            p1 = p3 - me.clientX; p2 = p4 - me.clientY; p3 = me.clientX; p4 = me.clientY;
            icon.style.top = (icon.offsetTop - p2) + "px";
            icon.style.left = (icon.offsetLeft - p1) + "px";
        };
    };
}

/* Window Content Definitions */
const windowContents = {
    'about': {
        title: 'About Kenneth - My Computer',
        icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Crect x='10' y='8' width='28' height='22' rx='2' fill='%23DCDAD5' stroke='%23716F64' stroke-width='2'/%3E%3Crect x='13' y='11' width='22' height='16' fill='%233A6EA5'/%3E%3Cpath d='M18 30l-4 8h20l-4-8z' fill='%23DCDAD5' stroke='%23716F64' stroke-width='2'/%3E%3C/svg%3E",
        content: `
            <div class="xp-content-wrapper about-win">
                <div class="sidebar">
                    <img src="Me-pixel-smile.jpeg" class="profile-pic" style="object-fit: cover;">
                    <h3>Kenneth</h3><p>24 Years Old</p><p>Aarhus, Denmark</p>
                </div>
                <div class="main-content">
                    <h2>Hey, I'm Kenneth!</h2>
                    <p>I'm a 24-year-old multimedia enthusiast living in Aarhus, Denmark. I build weird, fun, and useful web things.</p>
                    <div class="skills-mini">
                        <span class="skill-tag">HTML5</span><span class="skill-tag">CSS3</span><span class="skill-tag">JavaScript</span>
                        <span class="skill-tag">Figma</span><span class="skill-tag">UI/UX</span>
                    </div>
                </div>
            </div>
        `
    },
    'projects': {
        title: 'Projects - My Documents',
        icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cpath d='M4 12v24h40V16H24l-4-4H4z' fill='%23FFC000' stroke='%23D49B00' stroke-width='2'/%3E%3C/svg%3E",
        content: `
            <div class="xp-explorer">
                <div class="explorer-toolbar">
                    <button><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Cpath d='M10 2L4 8l6 6' stroke='%233a9d23' stroke-width='2' fill='none'/%3E%3C/svg%3E"> Back</button>
                    <div class="divider"></div>
                    <button><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Cpath d='M2 4v10h12V6H8l-2-2H2z' fill='%23ffcc00'/%3E%3C/svg%3E"> Folders</button>
                </div>
                <div class="explorer-grid">
                    <div class="explorer-item" onclick="openProject('volume-village')"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cpath d='M4 12v24h40V16H24l-4-4H4z' fill='%23FFC000' stroke='%23D49B00' stroke-width='2'/%3E%3C/svg%3E"><span>Volume Village</span></div>
                    <div class="explorer-item" onclick="openProject('black-bible')"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cpath d='M4 12v24h40V16H24l-4-4H4z' fill='%23FFC000' stroke='%23D49B00' stroke-width='2'/%3E%3C/svg%3E"><span>Premium Black Bible</span></div>
                    <div class="explorer-item" onclick="openProject('bitcoin-basics')"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cpath d='M4 12v24h40V16H24l-4-4H4z' fill='%23FFC000' stroke='%23D49B00' stroke-width='2'/%3E%3C/svg%3E"><span>Bitcoin Basics</span></div>
                    <div class="explorer-item" onclick="openProject('basedman')"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cpath d='M4 12v24h40V16H24l-4-4H4z' fill='%23FFC000' stroke='%23D49B00' stroke-width='2'/%3E%3C/svg%3E"><span>Basedman</span></div>
                </div>
            </div>
        `
    },
    'skills': {
        title: 'System Properties',
        icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Crect x='10' y='10' width='28' height='28' fill='%23808080'/%3E%3C/svg%3E",
        content: `
            <div class="xp-tabs">
                <div class="tab-list">
                    <button class="tab-btn active" onclick="switchTab(this, 'general')">General</button>
                    <button class="tab-btn" onclick="switchTab(this, 'hardware')">Hardware</button>
                </div>
                <div class="tab-content active" id="tab-general">
                    <p><strong>System:</strong> Microsoft Windows XP Professional</p>
                    <p><strong>Registered to:</strong> Kenneth, Aarhus, Denmark</p>
                </div>
                <div class="tab-content" id="tab-hardware">
                    <ul><li>VS Code</li><li>Figma</li><li>Vercel</li></ul>
                </div>
            </div>
        `
    },
    'contact': {
        title: 'New Message - Outlook Express',
        icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Cpath d='M1 3h14v10H1V3zm2 2v6l5-3.5L3 5zm10 0L8 8.5 3 5h10z' fill='%23666'/%3E%3C/svg%3E",
        content: `
            <div class="outlook-win">
                <div class="outlook-toolbar"><button>Send</button></div>
                <div class="outlook-form">
                    <div class="form-row"><span>To:</span><input type="text" value="kenneth@aarhus.dk" readonly></div>
                    <div class="form-row"><span>Subject:</span><input type="text"></div>
                    <textarea></textarea>
                </div>
            </div>
        `
    },
    'resume': {
        title: 'Resume.txt - Notepad',
        icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Cpath d='M2 2h12v12H2V2z' fill='white' stroke='black'/%3E%3Cline x1='4' y1='5' x2='10' y2='5' stroke='black'/%3E%3Cline x1='4' y1='8' x2='12' y2='8' stroke='black'/%3E%3C/svg%3E",
        content: `
            <div class="notepad-win"><textarea readonly>KENNETH - MULTIMEDIA CREATOR\nLocation: Aarhus, Denmark\nAge: 24</textarea></div>
        `
    },
    'ie': {
        title: 'Internet Explorer',
        icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Ccircle cx='24' cy='24' r='18' fill='%23003399'/%3E%3Ctext x='24' y='32' font-family='Arial' font-size='24' font-weight='bold' fill='white' text-anchor='middle'%3Ee%3C/text%3E%3C/svg%3E",
        content: `
            <div class="ie-layout">
                <div class="ie-sidebar">
                    <h3>Favorites</h3>
                    <a href="#" class="fav-link"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Ccircle cx='24' cy='24' r='16' fill='%23003399' stroke='%23001F5C' stroke-width='2'/%3E%3Cpath d='M8 24c0-8.8 7.2-16 16-16s16 7.2 16 16' fill='none' stroke='%23FFC000' stroke-width='4'/%3E%3C/svg%3E"> Kenneth's Twitter</a>
                    <a href="#" class="fav-link"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Ccircle cx='24' cy='24' r='16' fill='%23003399' stroke='%23001F5C' stroke-width='2'/%3E%3Cpath d='M8 24c0-8.8 7.2-16 16-16s16 7.2 16 16' fill='none' stroke='%23FFC000' stroke-width='4'/%3E%3C/svg%3E"> Aarhus Guide</a>
                    <a href="#" class="fav-link"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Ccircle cx='24' cy='24' r='16' fill='%23003399' stroke='%23001F5C' stroke-width='2'/%3E%3Cpath d='M8 24c0-8.8 7.2-16 16-16s16 7.2 16 16' fill='none' stroke='%23FFC000' stroke-width='4'/%3E%3C/svg%3E"> Web Dev 2001</a>
                    <div class="divider"></div>
                    <h3>History</h3>
                    <div style="font-size:10px; color:#666; padding:5px;">Today - Aarhus Portfolio</div>
                </div>
                <div style="flex-grow:1; display:flex; flex-direction:column;">
                    <div class="ie-address-bar">
                        <span>Address</span>
                        <input type="text" value="http://www.aarhus-portal.dk" readonly>
                    </div>
                    <div id="dial-up-overlay" style="position:absolute; top:50px; left:0; width:100%; height:calc(100% - 50px); background:#ECE9D8; z-index:10; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Crect x='2' y='2' width='12' height='12' fill='%23ccc'/%3E%3C/svg%3E" width="48">
                        <p style="margin-top:10px;">Connecting to Aarhus ISP...</p>
                        <button class="xp-btn" onclick="this.parentElement.remove()" style="margin-top:20px;">Cancel</button>
                    </div>
                    <div class="ie-homepage" style="padding:40px; background:white; height:100%; overflow-y:auto; text-align:center;">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 30'%3E%3Crect width='100' height='30' rx='15' fill='%233a9d23'/%3E%3Ctext x='50' y='20' font-family='Arial' font-size='14' fill='white' text-anchor='middle'%3Estart%3C/text%3E%3C/svg%3E" width="150" style="margin-bottom:20px;">
                        <h1 style="color:#003399; font-size:24px;">Aarhus Portal</h1>
                        <p style="margin-bottom:20px;">Welcome to your local gateway to the web.</p>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; text-align:left; max-width:400px; margin:0 auto;">
                            <div>
                                <h4 style="color:#cc6600;">Latest News</h4>
                                <ul style="list-style:none; padding:0; font-size:10px;">
                                    <li>• Aarhus modern art museum opens!</li>
                                    <li>• New Viking exhibit at Moesgaard.</li>
                                </ul>
                            </div>
                            <div>
                                <h4 style="color:#4b64b5;">Multimedia</h4>
                                <ul style="list-style:none; padding:0; font-size:10px;">
                                    <li>• Winamp 2.8 released.</li>
                                    <li>• Flash player update available.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
    },
    'winamp': {
        title: 'Winamp',
        icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23333'/%3E%3C/svg%3E",
        content: `
            <div class="winamp-win">
                <div class="winamp-top">
                    <div>Kenneth - Bass.mp3</div>
                    <div>02:15</div>
                </div>
                <div style="padding:10px;">
                    <div class="winamp-viz-bar">
                        ${Array(15).fill().map(() => `<div class="viz-line" style="height:${Math.random() * 100}%"></div>`).join('')}
                    </div>
                </div>
                <div class="winamp-controls">
                    <button class="winamp-btn-small">PREV</button>
                    <button class="winamp-btn-small" onclick="playSound('startup-sound')">PLAY</button>
                    <button class="winamp-btn-small">PAUSE</button>
                    <button class="winamp-btn-small">STOP</button>
                    <button class="winamp-btn-small">NEXT</button>
                </div>
            </div>
        `
    },
    'error-trigger': {
        title: 'Error',
        icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M8 1l7 14H1L8 1z' fill='yellow' stroke='black'/%3E%3Ctext x='8' y='13' font-size='10' text-anchor='middle'%3E!%3C/text%3E%3C/svg%3E",
        content: `
            <div style="padding:20px; text-align:center;">
                <p>A fatal exception 0E has occurred at 0028:C0011E36. The current application will be terminated.</p>
                <br>
                <p>Click "Repair" to fix your computer.</p>
                <br>
                <button class="xp-btn" onclick="startErrorAccordion()">Repair</button>
            </div>
        `
    },
    'solitaire': {
        title: 'Solitaire',
        icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' fill='green'/%3E%3C/svg%3E",
        content: `<div style="text-align:center; padding:20px;"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' fill='green'/%3E%3C/svg%3E" width="64"><br><br><a href="https://solitaireforfree.com/" target="_blank" class="xp-btn" style="text-decoration:none;">Play Solitaire</a></div>`
    },
    'recycle-bin': {
        title: 'Recycle Bin',
        icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Crect x='14' y='14' width='20' height='24' fill='%233a6ea5'/%3E%3Crect x='12' y='10' width='24' height='4' fill='%23666'/%3E%3C/svg%3E",
        content: `<div class="explorer-grid"><div class="explorer-item grayed-out"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cpath d='M6 4v24h20V10l-6-6H6z' fill='white' stroke='black'/%3E%3C/svg%3E"><span>Failed NFTs.txt</span></div></div>`
    },
    'sound-test': {
        title: 'Sound and Audio Devices',
        icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Cpath d='M2 6v4h3l4 4V2L5 6H2zM12 8c0-2-1-3-2-4v8c1-1 2-2 2-4z' fill='%23666'/%3E%3C/svg%3E",
        content: `
            <div class="xp-tabs" style="height:100%">
                <div class="tab-list">
                    <button class="tab-btn active">Diagnostics</button>
                    <button class="tab-btn" onclick="alert('Device: Kenneth High Definition Audio')">Hardware</button>
                </div>
                <div class="tab-content active" style="padding: 15px;">
                    <p style="margin-bottom:15px; color:#444;">If you see "NotSupportedError", your browser blocked the connection. Click "Reset Audio" to force a reconnect.</p>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                        <button class="xp-btn" onclick="playSound('startup-sound')">▶ Startup Sound</button>
                        <button class="xp-btn" onclick="playSound('click-sound')">▶ Click Sound</button>
                        <button class="xp-btn" onclick="forceResetAudio()">🔥 Reset Audio</button>
                        <button class="xp-btn" onclick="openWindowById('sound-test')">🔄 Refresh Log</button>
                    </div>
                    <div style="margin-top:20px; padding:10px; background:#fff; border:1px inset #ccc; font-family:monospace; font-size:10px; height:100px; overflow-y:auto;" id="audio-log">
                        -- Sound System Diagnostic --<br>
                        Ready for testing...
                    </div>
                </div>
            </div>
        `
    },
    // ENHANCEMENT PACK: Working Notepad with localStorage
    'notepad-enhanced': {
        title: 'Notepad - Kenneth\'s Notes',
        icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Cpath d='M2 2h12v12H2V2z' fill='white' stroke='black'/%3E%3Cline x1='4' y1='5' x2='10' y2='5' stroke='black'/%3E%3Cline x1='4' y1='8' x2='12' y2='8' stroke='black'/%3E%3C/svg%3E",
        content: `
            <div class="notepad-enhanced">
                <div class="notepad-toolbar">
                    <button onclick="saveNote()">💾 Save</button>
                    <button onclick="loadNote()">📂 Load</button>
                    <button onclick="clearNote()">🗑️ Clear</button>
                </div>
                <textarea id="notepad-textarea" placeholder="Start typing your notes here..."></textarea>
                <div class="notepad-status" id="notepad-status">Ready | Autosave enabled</div>
            </div>
        `
    },
    // ENHANCEMENT PACK: Photo Viewer
    'photos': {
        title: 'Windows Picture and Fax Viewer',
        icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='4' y='4' width='24' height='24' fill='%23333' rx='2'/%3E%3Crect x='6' y='6' width='20' height='16' fill='%23666'/%3E%3Ccircle cx='12' cy='12' r='3' fill='%23ffcc00'/%3E%3Cpath d='M6 18l6-4 4 3 6-5v10H6z' fill='%2300aa00'/%3E%3C/svg%3E",
        content: `
            <div class="photo-viewer">
                <div class="photo-main">
                    <img id="photo-current" src="Me-pixel-smile.jpeg" alt="Portfolio Photo">
                </div>
                <div class="photo-thumbnails" id="photo-thumbs">
                    <img class="photo-thumb active" src="Me-pixel-smile.jpeg" onclick="changePhoto(this, 'Me-pixel-smile.jpeg')">
                    <img class="photo-thumb" src="Me-pixel.jpeg" onclick="changePhoto(this, 'Me-pixel.jpeg')">
                    <img class="photo-thumb" src="sitting-me.jpeg" onclick="changePhoto(this, 'sitting-me.jpeg')">
                    <img class="photo-thumb" src="xp-wallpaper.jpg" onclick="changePhoto(this, 'xp-wallpaper.jpg')">
                </div>
            </div>
        `
    },
    // ENHANCEMENT PACK V2: Working Calculator
    'calculator': {
        title: 'Calculator',
        icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='4' y='2' width='24' height='28' fill='%23ECE9D8' stroke='%23716F64'/%3E%3Crect x='6' y='4' width='20' height='8' fill='%2398FF98'/%3E%3Crect x='6' y='14' width='4' height='4' fill='%23ddd' stroke='%23888'/%3E%3Crect x='12' y='14' width='4' height='4' fill='%23ddd' stroke='%23888'/%3E%3Crect x='18' y='14' width='4' height='4' fill='%23ddd' stroke='%23888'/%3E%3Crect x='6' y='20' width='4' height='4' fill='%23ddd' stroke='%23888'/%3E%3Crect x='12' y='20' width='4' height='4' fill='%23ddd' stroke='%23888'/%3E%3Crect x='18' y='20' width='4' height='4' fill='%23ddd' stroke='%23888'/%3E%3C/svg%3E",
        content: `
            <div class="calculator-app">
                <div class="calc-display" id="calc-display">0</div>
                <div class="calc-buttons">
                    <button class="calc-btn calc-clear" onclick="calcClear()">C</button>
                    <button class="calc-btn calc-op" onclick="calcOp('/')">÷</button>
                    <button class="calc-btn calc-op" onclick="calcOp('*')">×</button>
                    <button class="calc-btn calc-op" onclick="calcBackspace()">⌫</button>
                    <button class="calc-btn" onclick="calcNum('7')">7</button>
                    <button class="calc-btn" onclick="calcNum('8')">8</button>
                    <button class="calc-btn" onclick="calcNum('9')">9</button>
                    <button class="calc-btn calc-op" onclick="calcOp('-')">−</button>
                    <button class="calc-btn" onclick="calcNum('4')">4</button>
                    <button class="calc-btn" onclick="calcNum('5')">5</button>
                    <button class="calc-btn" onclick="calcNum('6')">6</button>
                    <button class="calc-btn calc-op" onclick="calcOp('+')">+</button>
                    <button class="calc-btn" onclick="calcNum('1')">1</button>
                    <button class="calc-btn" onclick="calcNum('2')">2</button>
                    <button class="calc-btn" onclick="calcNum('3')">3</button>
                    <button class="calc-btn calc-equals" onclick="calcEquals()">=</button>
                    <button class="calc-btn calc-zero" onclick="calcNum('0')">0</button>
                    <button class="calc-btn" onclick="calcNum('.')">.</button>
                </div>
            </div>
        `
    },
    // ENHANCEMENT PACK V2: Snake Game (Easter Egg)
    'snake': {
        title: 'Snake - Easter Egg!',
        icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23000'/%3E%3Crect x='4' y='14' width='4' height='4' fill='%2300ff00'/%3E%3Crect x='8' y='14' width='4' height='4' fill='%2300ff00'/%3E%3Crect x='12' y='14' width='4' height='4' fill='%2300ff00'/%3E%3Crect x='16' y='14' width='4' height='4' fill='%2300ff00'/%3E%3Crect x='24' y='8' width='4' height='4' fill='%23ff0000'/%3E%3C/svg%3E",
        content: `
            <div class="snake-game">
                <canvas id="snake-canvas" width="300" height="300"></canvas>
                <div class="snake-info">
                    <span>Score: <span id="snake-score">0</span></span>
                    <button class="xp-btn" onclick="startSnake()">Start Game</button>
                </div>
                <p style="font-size:10px; color:#666; margin-top:10px;">Use Arrow Keys to move</p>
            </div>
        `
    },
    // ENHANCEMENT PACK V2: File System Explorer
    'my-computer-explorer': {
        title: 'My Computer',
        icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect x='10' y='10' width='28' height='20' fill='%23666'/%3E%3Crect x='12' y='12' width='24' height='16' fill='%233a6ea5'/%3E%3Crect x='18' y='30' width='12' height='4' fill='%23666'/%3E%3C/svg%3E",
        content: `
            <div class="xp-explorer">
                <div class="explorer-toolbar">
                    <button onclick="navigateFS('root')">← Back</button>
                    <span id="fs-path">C:\\</span>
                </div>
                <div class="explorer-grid" id="fs-content">
                    <div class="explorer-item" onclick="navigateFS('documents')">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath d='M4 8v16h24V10H16l-2-2H4z' fill='%23ffcc00'/%3E%3C/svg%3E">
                        <span>My Documents</span>
                    </div>
                    <div class="explorer-item" onclick="navigateFS('pictures')">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath d='M4 8v16h24V10H16l-2-2H4z' fill='%2366ccff'/%3E%3C/svg%3E">
                        <span>My Pictures</span>
                    </div>
                    <div class="explorer-item" onclick="navigateFS('music')">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath d='M4 8v16h24V10H16l-2-2H4z' fill='%23ff9966'/%3E%3C/svg%3E">
                        <span>My Music</span>
                    </div>
                    <div class="explorer-item" onclick="openWindowById('control-panel')">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='4' y='4' width='24' height='24' fill='%23808080'/%3E%3Crect x='8' y='8' width='6' height='6' fill='white'/%3E%3Crect x='18' y='8' width='6' height='6' fill='white'/%3E%3C/svg%3E">
                        <span>Control Panel</span>
                    </div>
                </div>
            </div>
        `
    },
    // ENHANCEMENT PACK V2: Skills with Progress Bars
    'skills-enhanced': {
        title: 'Kenneth\'s Skills - System Properties',
        icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='4' y='4' width='24' height='24' fill='%23808080'/%3E%3Crect x='8' y='8' width='16' height='3' fill='%2300ff00'/%3E%3Crect x='8' y='14' width='12' height='3' fill='%2300ff00'/%3E%3Crect x='8' y='20' width='14' height='3' fill='%2300ff00'/%3E%3C/svg%3E",
        content: `
            <div class="skills-enhanced">
                <h3>Technical Skills</h3>
                <div class="skill-item">
                    <label>HTML/CSS</label>
                    <div class="skill-bar"><div class="skill-fill" style="width:95%"></div></div>
                    <span>95%</span>
                </div>
                <div class="skill-item">
                    <label>JavaScript</label>
                    <div class="skill-bar"><div class="skill-fill" style="width:90%"></div></div>
                    <span>90%</span>
                </div>
                <div class="skill-item">
                    <label>React/Next.js</label>
                    <div class="skill-bar"><div class="skill-fill" style="width:85%"></div></div>
                    <span>85%</span>
                </div>
                <div class="skill-item">
                    <label>UI/UX Design</label>
                    <div class="skill-bar"><div class="skill-fill" style="width:88%"></div></div>
                    <span>88%</span>
                </div>
                <div class="skill-item">
                    <label>Figma</label>
                    <div class="skill-bar"><div class="skill-fill" style="width:92%"></div></div>
                    <span>92%</span>
                </div>
                <div class="skill-item">
                    <label>Video Editing</label>
                    <div class="skill-bar"><div class="skill-fill" style="width:80%"></div></div>
                    <span>80%</span>
                </div>
            </div>
        `
    },
    // ENHANCEMENT PACK V2: Weather Widget
    'weather': {
        title: 'Aarhus Weather',
        icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='14' r='6' fill='%23FFD700'/%3E%3Cpath d='M16 2v4M16 22v4M4 14h4M24 14h4M7 7l3 3M22 22l3 3M7 21l3-3M22 4l3 3' stroke='%23FFD700' stroke-width='2'/%3E%3C/svg%3E",
        content: `
            <div class="weather-widget">
                <div class="weather-main">
                    <div class="weather-icon">☀️</div>
                    <div class="weather-temp">12°C</div>
                </div>
                <div class="weather-details">
                    <p><strong>Aarhus, Denmark</strong></p>
                    <p>Partly Cloudy</p>
                    <div class="weather-stats">
                        <span>💨 12 km/h</span>
                        <span>💧 65%</span>
                        <span>🌡️ Feels like 10°C</span>
                    </div>
                </div>
                <div class="weather-forecast">
                    <div class="forecast-day"><span>Mon</span><span>☀️</span><span>14°</span></div>
                    <div class="forecast-day"><span>Tue</span><span>⛅</span><span>11°</span></div>
                    <div class="forecast-day"><span>Wed</span><span>🌧️</span><span>9°</span></div>
                    <div class="forecast-day"><span>Thu</span><span>☀️</span><span>13°</span></div>
                    <div class="forecast-day"><span>Fri</span><span>⛅</span><span>12°</span></div>
                </div>
            </div>
        `
    }
};

const projectDetails = {
    'volume-village': { title: 'Volume Village', link: 'https://updated-volume-village.vercel.app/', desc: 'Underground culture hub in Aarhus—events, concerts, and raves. A multimedia project showcasing the vibrant local scene.' },
    'black-bible': { title: 'Premium Black Bible', link: 'https://premiumblackbible.com/', desc: 'Minimal scripture-inspired book/ebook promo site with waitlist.' },
    'bitcoin-basics': { title: 'Bitcoin Basics', link: 'https://bitcoin-basics.vercel.app/', desc: 'Beginner-friendly Bitcoin education guide—levels, wallets, freedom vibes.' },
    'basedman': { title: 'Basedman', link: 'https://basedman.io/', desc: 'Meme hero NFT/token site in the Pepecoin universe—based culture protector.' }
};

function openWindowById(id) {
    const win = windowContents[id];
    if (win) {
        createWindow(id, win.title, win.icon, win.content);
        if (id === 'cmd' && window.initCmdLogic) window.initCmdLogic();
    }
}

function openProject(projectId) {
    const project = projectDetails[projectId];
    if (project) {
        const content = `
            <div class="project-view" style="padding: 30px; line-height: 1.6;">
                <h1 style="color: #003399; font-size: 18px; margin-bottom: 15px;">${project.title}</h1>
                <p style="font-size: 12px; margin-bottom: 20px;">${project.desc}</p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button class="xp-btn" onclick="openInIE('${project.link}')">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='6' fill='%23003399'/%3E%3Ctext x='8' y='11' font-size='10' fill='white' text-anchor='middle'%3Ee%3C/text%3E%3C/svg%3E" width="16" style="vertical-align: middle; margin-right: 5px;">
                        Immersive IE View
                    </button>
                    <a href="${project.link}" target="_blank" class="xp-btn" style="text-decoration: none; color: black; line-height: 1.4;">
                        Launch External
                    </a>
                </div>
            </div>
        `;
        createWindow(`proj-${projectId}`, project.title, "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cpath d='M4 12v24h40V16H24l-4-4H4z' fill='%23FFC000' stroke='%23D49B00' stroke-width='2'/%3E%3C/svg%3E", content);
    }
}

function openInIE(url) {
    const content = `
        <div class="ie-browser" style="display: flex; flex-direction: column; height: 100%;">
            <div class="ie-address-bar" style="background: #ECE9D8; padding: 5px; border-bottom: 1px solid #ACA899; display: flex; align-items: center; gap: 5px;">
                <span style="font-size: 11px;">Address</span>
                <input type="text" value="${url}" readonly style="flex-grow: 1; border: 1px solid #ACA899; padding: 2px 5px; background: white;">
                <button class="xp-btn" style="padding: 1px 10px;">Go</button>
            </div>
            <iframe src="${url}" style="flex-grow: 1; border: none; background: white;"></iframe>
        </div>
    `;
    createWindow('ie-immersive', 'Internet Explorer', "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Ccircle cx='24' cy='24' r='18' fill='%23003399'/%3E%3Ctext x='24' y='32' font-family='Arial' font-size='24' font-weight='bold' fill='white' text-anchor='middle'%3Ee%3C/text%3E%3C/svg%3E", content);
}

function switchTab(btn, tabId) {
    const tabs = btn.closest('.xp-tabs');
    tabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    tabs.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    tabs.querySelector(`#tab-${tabId}`).classList.add('active');
}

/* Context Menu */
const contextMenu = document.createElement('div');
contextMenu.id = 'context-menu'; contextMenu.className = 'hidden';
contextMenu.innerHTML = `
    <div class="ctx-item" onclick="location.reload()">Refresh</div>
    <div class="divider"></div>
    <div class="ctx-item" onclick="createStickyNote()">New Sticky Note</div>
    <div class="ctx-item" onclick="openWindowById('display-props')">Properties</div>
    <div class="divider"></div>
    <div class="ctx-item" onclick="alert('Shortcut placeholder')">New → Shortcut</div>
`;

window.createStickyNote = function () {
    const note = document.createElement('div');
    note.className = 'sticky-note';
    note.style.left = (200 + Math.random() * 200) + 'px';
    note.style.top = (200 + Math.random() * 200) + 'px';
    note.innerHTML = `<textarea placeholder="Type a note..."></textarea>`;
    document.getElementById('desktop').appendChild(note);

    // Simple drag fix for sticky note (since it doesn't have a title bar)
    note.onmousedown = (e) => {
        // Bring to front
        note.style.zIndex = ++zIndexCounter;

        // If clicking the textarea, only allow dragging if clicking the very edges
        if (e.target.tagName === 'TEXTAREA') {
            // Check if we are clicking near the top/edges to drag
            const rect = note.getBoundingClientRect();
            if (e.clientY - rect.top > 20) return; // Only top 20px is draggable for textarea
        }

        e.preventDefault();
        let p3 = e.clientX;
        let p4 = e.clientY;

        const onMouseMove = (me) => {
            const p1 = p3 - me.clientX;
            const p2 = p4 - me.clientY;
            p3 = me.clientX;
            p4 = me.clientY;
            note.style.top = (note.offsetTop - p2) + "px";
            note.style.left = (note.offsetLeft - p1) + "px";
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };
};

// MSN Toast Trigger logic
window.showMsnToast = function (name) {
    const toast = document.createElement('div');
    toast.id = 'msn-toast';
    toast.innerHTML = `
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 50 50'%3E%3Ccircle cx='25' cy='25' r='25' fill='%23ccc'/%3E%3Crect x='15' y='15' width='20' height='20' fill='white' rx='5'/%3E%3C/svg%3E" class="toast-pfp">
        <div class="toast-text">
            <strong>${name}</strong>
            <span>just signed in.</span>
        </div>
    `;
    document.body.appendChild(toast);
    playSound('startup-sound'); // Optional: replace with a "ding" if available
    setTimeout(() => {
        toast.style.animation = 'toastSlideUp 0.5s reverse forwards';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
};

// Periodically show toast
setInterval(() => {
    if (Math.random() > 0.7) {
        const names = ["John", "Sarah", "Recruiter", "Aarhus Mayor"];
        showMsnToast(names[Math.floor(Math.random() * names.length)]);
    }
}, 30000); // Check every 30s
document.body.appendChild(contextMenu);
document.getElementById('desktop').oncontextmenu = (e) => { e.preventDefault(); contextMenu.style.top = e.clientY + 'px'; contextMenu.style.left = e.clientX + 'px'; contextMenu.classList.remove('hidden'); };
document.addEventListener('click', () => contextMenu.classList.add('hidden'));


/* --- NEW WINDOW XP FEATURES --- */

// 1. Search Companion (Rover)
windowContents['search'] = {
    title: 'Search Results',
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='14' cy='14' r='8' stroke='black' stroke-width='2' fill='none'/%3E%3Cline x1='20' y1='20' x2='28' y2='28' stroke='black' stroke-width='3'/%3E%3C/svg%3E",
    content: `
        <div class="search-companion">
            <div class="rover-area">
                <img src="https://winxp.vercel.app/rover.gif" class="rover-gif" alt="Rover" id="rover-companion" style="cursor:pointer;" onclick="if(window.clippySpeak) {
                    const roverPhrases = [
                        { text: 'Did you know Rover used to be a movie star? He\'s very famous in the Windows XP world.', audio: 'sounds/clippy/rover_star.mp3' },
                        { text: 'Who\'s a good search companion? Rover is! Yes he is!', audio: 'sounds/clippy/rover_goodboy.mp3' }
                    ];
                    const p = roverPhrases[Math.floor(Math.random() * roverPhrases.length)];
                    window.clippySpeak(p.text, p.audio);
                }">
                <p>Welcome to Search Companion. Searching for files, people, or web results?</p>
            </div>
            <div class="search-options">
                <p>What do you want to search for?</p>
                <span class="search-link" onclick="alert('Searching for: Projects...')">→ Pictures, music, or video</span>
                <span class="search-link" onclick="alert('Searching for: Skills...')">→ Documents (word processing, spreadsheet, etc.)</span>
                <span class="search-link" onclick="alert('Searching for: Kenneth...')">→ All files and folders</span>
                <span class="search-link" onclick="openWindowById('ie')">→ Search the Internet</span>
            </div>
        </div>
    `
};

// 2. Space Cadet Pinball
windowContents['pinball'] = {
    title: '3D Pinball for Windows - Space Cadet',
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23003399'/%3E%3Ccircle cx='16' cy='16' r='8' fill='silver'/%3E%3C/svg%3E",
    content: `
        <div style="width:100%; height:100%; background:black;">
            <iframe src="https://alula.github.io/SpaceCadetPinball/" style="width:100%; height:100%; border:none;"></iframe>
        </div>
    `
};

// 3. Windows Media Player
windowContents['wmp'] = {
    title: 'Windows Media Player',
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='12' fill='%23ff6600'/%3E%3Cpath d='M12 10v12l10-6z' fill='white'/%3E%3C/svg%3E",
    content: `
        <div class="wmp-win">
            <div class="wmp-viz">
                <div style="z-index:1; text-align:center;">
                    <p style="font-size:14px; margin-bottom:10px;">Kenneth's Chill Mix</p>
                    <p style="font-size:10px; color:#aaa;">02:45 / 04:20</p>
                </div>
            </div>
            <div class="wmp-controls">
                <div class="wmp-btn">⏮</div>
                <div class="wmp-btn" style="width:40px; height:40px; font-size:18px;" onclick="playSound('startup-sound')">▶</div>
                <div class="wmp-btn">⏭</div>
            </div>
        </div>
    `
};

// 4. JS Paint (MS Paint Clone)
windowContents['paint'] = {
    title: 'untitled - Paint',
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='4' y='4' width='24' height='24' fill='white' stroke='black'/%3E%3Ccircle cx='10' cy='10' r='3' fill='red'/%3E%3Ccircle cx='22' cy='10' r='3' fill='blue'/%3E%3Ccircle cx='16' cy='22' r='4' fill='yellow'/%3E%3C/svg%3E",
    content: `
        <iframe src="https://jspaint.app/" style="width:100%; height:100%; border:none;"></iframe>
    `
};

// 5. Minesweeper
windowContents['minesweeper'] = {
    title: 'Minesweeper',
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23ccc'/%3E%3Ccircle cx='16' cy='16' r='6' fill='black'/%3E%3C/svg%3E",
    content: `
        <iframe src="https://minesweeperapp.com/" style="width:100%; height:100%; border:none;"></iframe>
    `
};

// 6. Display Properties (Theme Switcher)
windowContents['display-props'] = {
    title: 'Display Properties',
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='4' y='4' width='24' height='18' fill='%23333'/%3E%3Crect x='6' y='6' width='20' height='14' fill='%233a6ea5'/%3E%3Crect x='12' y='22' width='8' height='4' fill='%23666'/%3E%3C/svg%3E",
    content: `
        <div class="xp-tabs">
            <div class="tab-list">
                <button class="tab-btn active" onclick="switchTab(this, 'desktop-bg')">Desktop</button>
                <button class="tab-btn" onclick="switchTab(this, 'appearance')">Appearance</button>
                <button class="tab-btn" onclick="switchTab(this, 'materials')">Materials</button>
            </div>
            <div class="tab-content active" id="tab-desktop-bg">
                <p style="margin-bottom:10px;">Select a background for your desktop:</p>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                    <button class="xp-btn" onclick="changeWallpaper('xp-wallpaper.jpg')">Default XP</button>
                    <button class="xp-btn" onclick="changeWallpaper('https://images.unsplash.com/photo-1541411191165-f18b6f5d27a7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')">Original Bliss</button>
                    <button class="xp-btn" onclick="changeWallpaper('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000')">Aarhus Mountains</button>
                    <button class="xp-btn" onclick="changeWallpaper('https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1000')">Autumn Lake</button>
                    <button class="xp-btn" onclick="changeWallpaper('https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1000')">Nature Green</button>
                </div>
            </div>
            <div class="tab-content" id="tab-appearance">
                <p style="margin-bottom:10px;">Windows and buttons color scheme:</p>
                <div class="theme-selection-grid">
                    <button class="xp-btn" onclick="changeTheme('default')">Default (Blue)</button>
                    <button class="xp-btn" onclick="changeTheme('silver')">Silver</button>
                    <button class="xp-btn" onclick="changeTheme('olive')">Olive Green</button>
                    <button class="xp-btn" onclick="changeTheme('royale')">Royale (Energy Blue)</button>
                    <button class="xp-btn" onclick="changeTheme('noir')">Noir / Zune</button>
                    <button class="xp-btn" onclick="changeTheme('crimson')">Crimson (Ruby)</button>
                    <button class="xp-btn" onclick="changeTheme('emerald')">Emerald (Jade)</button>
                    <button class="xp-btn" onclick="changeTheme('amethyst')">Amethyst (Purple)</button>
                    <button class="xp-btn" onclick="changeTheme('amber')">Amber (Gold)</button>
                    <button class="xp-btn" onclick="changeTheme('classic')">Classic (Retro)</button>
                    <button class="xp-btn" onclick="changeTheme('aarhus')" style="background: #0B0E14; color: #FF6B00; font-weight: bold;">Aarhus Midnight (PRO)</button>
                </div>
                <br>
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 30'%3E%3Crect width='100' height='30' rx='15' fill='%233a9d23'/%3E%3Ctext x='50' y='20' font-family='Arial' font-size='14' fill='white' text-anchor='middle'%3Estart%3C/text%3E%3C/svg%3E" style="width:100px; opacity:0.5;">
            </div>
            <div class="tab-content" id="tab-materials">
                <p style="margin-bottom:10px;">Apply a material effect to windows:</p>
                <div class="material-options">
                    <label class="material-option">
                        <input type="radio" name="material" value="none" checked onclick="changeMaterial('none')">
                        <div class="material-preview" style="background:#ECE9D8;"></div>
                        <span>None (Default)</span>
                    </label>
                    <label class="material-option">
                        <input type="radio" name="material" value="plastic" onclick="changeMaterial('plastic')">
                        <div class="material-preview" style="background:linear-gradient(135deg,rgba(255,255,255,0.95),rgba(220,220,220,0.6));"></div>
                        <span>Plastic Wrap</span>
                    </label>
                    <label class="material-option">
                        <input type="radio" name="material" value="chrome" onclick="changeMaterial('chrome')">
                        <div class="material-preview" style="background:linear-gradient(135deg,#aaa,#fff,#999);"></div>
                        <span>Liquid Chrome</span>
                    </label>
                    <label class="material-option">
                        <input type="radio" name="material" value="glass" onclick="changeMaterial('glass')">
                        <div class="material-preview" style="background:rgba(200,220,255,0.6);"></div>
                        <span>Glass</span>
                    </label>
                    <label class="material-option">
                        <input type="radio" name="material" value="cotton" onclick="changeMaterial('cotton')">
                        <div class="material-preview" style="background:#f5f5f5;border-radius:4px;"></div>
                        <span>Soft Cotton</span>
                    </label>
                </div>
            </div>
        </div>
    `
};

// 8. Windows Messenger (MSN)
windowContents['msn'] = {
    title: 'Windows Messenger',
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='12' fill='%2300cc00'/%3E%3C/svg%3E",
    content: `
        <div class="msn-win">
            <div class="msn-header">
                <img src="Me-pixel-smile.jpeg" class="msn-pfp" style="object-fit: cover;">
                <div>
                    <div style="font-weight:bold;">Kenneth (Online)</div>
                    <div style="font-size:9px; color:#666;">I'm a multimedia creator!</div>
                </div>
            </div>
            <div class="msn-contact-list">
                <div class="msn-group">Online (3)</div>
                <div class="msn-contact"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='6' fill='%2300cc00'/%3E%3C/svg%3E" class="msn-status"> <span>John (Aarhus)</span></div>
                <div class="msn-contact"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='6' fill='%2300cc00'/%3E%3C/svg%3E" class="msn-status"> <span>Sarah (Client)</span></div>
                <div class="msn-contact" onclick="alert('Starting chat with Recruiter...')"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='6' fill='%2300cc00'/%3E%3C/svg%3E" class="msn-status"> <span>Recruiter</span></div>
                <div class="msn-group">Offline (12)</div>
                <div class="msn-contact"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='6' fill='gray'/%3E%3C/svg%3E" class="msn-status"> <span>Clippy</span></div>
            </div>
            <div class="msn-footer">
                <button class="xp-btn" style="width:100%;">Add a Contact</button>
            </div>
        </div>
    `
};

// 9. Sound Recorder
windowContents['sound-recorder'] = {
    title: 'Sound - Sound Recorder',
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='10' y='4' width='12' height='18' rx='6' fill='%23666'/%3E%3Crect x='8' y='22' width='16' height='4' fill='%23333'/%3E%3C/svg%3E",
    content: `
        <div class="sound-recorder-win">
            <div style="font-size:10px; margin-bottom:5px;">Length: 0.0 sec.</div>
            <div class="sr-display">
                <div class="sr-waveform" id="sr-wave"></div>
            </div>
            <div class="sr-controls">
                <div class="sr-btn-circle" onclick="alert('Seeking...')">⏮</div>
                <div class="sr-btn-circle" onclick="alert('Seeking...')">⏭</div>
                <div class="sr-btn-circle play" onclick="playSound('startup-sound')">▶</div>
                <div class="sr-btn-circle stop" onclick="alert('Stopped')">■</div>
                <div class="sr-btn-circle rec" onclick="alert('Recording...')">●</div>
            </div>
        </div>
    `
};

// 10. Control Panel
windowContents['control-panel'] = {
    title: 'Control Panel',
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='4' y='4' width='24' height='24' fill='%23808080'/%3E%3Crect x='8' y='8' width='6' height='6' fill='white'/%3E%3Crect x='18' y='8' width='6' height='6' fill='white'/%3E%3Crect x='8' y='18' width='6' height='6' fill='white'/%3E%3Crect x='18' y='18' width='6' height='6' fill='white'/%3E%3C/svg%3E",
    content: `
        <div class="xp-explorer">
            <div class="explorer-toolbar">
                <button onclick="openWindowById('display-props')">Display</button>
                <div class="divider"></div>
                <button onclick="toggleHighContrast()">Accessibility</button>
            </div>
            <div class="explorer-grid">
                <div class="explorer-item" onclick="toggleHighContrast()">
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='12' fill='black'/%3E%3Cpath d='M16 4a12 12 0 010 24z' fill='white'/%3E%3C/svg%3E">
                    <span>High Contrast Mode</span>
                </div>
                <div class="explorer-item" onclick="openWindowById('display-props')">
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='4' y='4' width='24' height='18' fill='%23333'/%3E%3Crect x='6' y='6' width='20' height='14' fill='%233a6ea5'/%3E%3Crect x='12' y='22' width='8' height='4' fill='%23666'/%3E%3C/svg%3E">
                    <span>Display Settings</span>
                </div>
                <div class="explorer-item" onclick="openWindowById('sound-recorder')">
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='10' y='4' width='12' height='18' rx='6' fill='%23666'/%3E%3Crect x='8' y='22' width='16' height='4' fill='%23333'/%3E%3C/svg%3E">
                    <span>Sounds and Audio</span>
                </div>
                <div class="explorer-item" onclick="openWindowById('windows-update')">
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23003399'/%3E%3Cpath d='M4 4l10 2v10H4V4zm14-2l10 2v10H18V2zM4 18h10v10l-10-2V18zm14 10V18h10v8l-10 2z' fill='white'/%3E%3C/svg%3E">
                    <span>Windows Update</span>
                </div>
            </div>
        </div>
    `
};

// 11. Windows Update
windowContents['windows-update'] = {
    title: 'Windows Update',
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23003399'/%3E%3Cpath d='M4 4l10 2v10H4V4zm14-2l10 2v10H18V2zM4 18h10v10l-10-2V18zm14 10V18h10v8l-10 2z' fill='white'/%3E%3C/svg%3E",
    content: `
        <div class="xp-explorer" style="background:white;">
            <div style="background:#003399; color:white; padding:20px;">
                <h1 style="font-size:18px;">Windows Update</h1>
            </div>
            <div style="padding:20px; color: black;">
                <p>Checking for latest updates for Kenneth's Portfolio...</p>
                <div style="margin:20px 0; border:1px solid #ACA899; height:15px; background:#eee; position:relative;">
                    <div style="position:absolute; top:0; left:0; height:100%; width:70%; background:linear-gradient(to right, #0055ff, #09adff); animation: progress 3s infinite;"></div>
                </div>
                <ul style="font-size:10px; color:#666;">
                    <li>• Critical Security Update - Aarhus 2001 (KB999999)</li>
                    <li>• Multimedia Pack 2.0 (DirectX 9.0c)</li>
                </ul>
                <br>
                <button class="xp-btn" onclick="alert('System is up to date!')">Install Updates</button>
            </div>
        </div>
    `
};

window.toggleHighContrast = function () {
    document.body.classList.toggle('high-contrast');
    if (window.clippySpeak) {
        const isHC = document.body.classList.contains('high-contrast');
        if (isHC) {
            window.clippySpeak("Whoa! That's high contrast! Very retro.", "sounds/clippy/hc_on.mp3");
        } else {
            window.clippySpeak("Back to the classic look!", "sounds/clippy/hc_off.mp3");
        }
    }
};

window.changeTheme = function (theme) {
    // Dynamically remove all theme-* classes (V18)
    const classList = document.body.classList;
    [...classList].forEach(cls => {
        if (cls.startsWith('theme-')) {
            classList.remove(cls);
        }
    });

    if (theme !== 'default') {
        document.body.classList.add(`theme-${theme}`);
    }

    if (window.clippySpeak) {
        window.clippySpeak(`Applied the new color scheme! Looking good.`, "sounds/clippy/theme_success.mp3");
    }
};

window.changeWallpaper = function (url) {
    const desktop = document.getElementById('desktop');
    if (desktop) {
        desktop.style.backgroundImage = `url('${url}')`;
        const char = document.getElementById('desktop-char');
        if (char) {
            char.style.display = url.includes('xp-wallpaper.jpg') ? 'block' : 'none';
        }
    }
};

window.changeMaterial = function (material) {
    const desktop = document.getElementById('desktop');
    const char = document.getElementById('desktop-char');

    // Reset Taskbar Styles (Prevent Glass Fix persistence)
    const tbRef = document.getElementById('taskbar');
    if (tbRef) {
        tbRef.style.cssText = '';
        Array.from(tbRef.children).forEach(c => c.style.cssText = '');
    }

    // Remove all material classes
    document.body.classList.remove('material-plastic', 'material-chrome', 'material-glass', 'material-cotton');

    // Material-specific backgrounds (Atmospheric mood setting for textures)
    const backgrounds = {
        none: 'xp-wallpaper.jpg',
        plastic: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', // Midnight for highlights
        chrome: 'linear-gradient(45deg, #000 0%, #444 45%, #888 50%, #444 55%, #000 100%)', // Mirror contrast
        glass: 'linear-gradient(180deg, #6a11cb 0%, #2575fc 100%)', // Crystalline blue
        cotton: 'linear-gradient(135deg, #fff5f5 0%, #f0f4ff 100%)' // Warm airy white
    };

    if (material !== 'none') {
        document.body.classList.add('material-' + material);
        if (desktop) {
            desktop.style.backgroundImage = backgrounds[material];
            desktop.style.backgroundSize = (material === 'chrome' || material === 'plastic') ? '200% 200%' : 'cover';
            desktop.style.animation = (material === 'chrome' || material === 'plastic') ? 'gradientShift 10s ease infinite' : 'none';
        }
        if (char) char.style.display = 'none';

        // EMERGENCY JS FIX FOR GLASS TASKBAR
        const userTaskbar = document.getElementById('taskbar');
        if (material === 'glass' && userTaskbar) {
            userTaskbar.style.cssText = 'background: rgba(40, 60, 110, 0.7) !important; z-index: 20000 !important; display: flex !important; visibility: visible !important; backdrop-filter: none !important;';
            // Force children interaction
            Array.from(userTaskbar.children).forEach(c => {
                c.style.cssText = 'position: relative; z-index: 20001; opacity: 1; visibility: visible;';
            });
        }
    } else {
        if (desktop) {
            desktop.style.backgroundImage = `url('${backgrounds.none}')`;
            desktop.style.backgroundSize = 'cover';
            desktop.style.animation = 'none';
        }
        if (char) char.style.display = 'block';
    }

    // Play physical sound
    window.playSound();
};

// Logic to add icons to desktop dynamically
(function initNewIcons() {
    const iconGrid = document.getElementById('icon-grid');
    const newItems = [
        { id: 'search', title: 'Search', icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='14' cy='14' r='8' stroke='black' stroke-width='2' fill='none'/%3E%3Cline x1='20' y1='20' x2='28' y2='28' stroke='black' stroke-width='3'/%3E%3C/svg%3E" },
        { id: 'pinball', title: 'Pinball', icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23003399'/%3E%3Ccircle cx='16' cy='16' r='8' fill='silver'/%3E%3C/svg%3E" },
        { id: 'wmp', title: 'Media Player', icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='12' fill='%23ff6600'/%3E%3Cpath d='M12 10v12l10-6z' fill='white'/%3E%3C/svg%3E" },
        { id: 'paint', title: 'Paint', icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='4' y='4' width='24' height='24' fill='white' stroke='black'/%3E%3Ccircle cx='10' cy='10' r='3' fill='red'/%3E%3Ccircle cx='22' cy='10' r='3' fill='blue'/%3E%3Ccircle cx='16' cy='22' r='4' fill='yellow'/%3E%3C/svg%3E" },
        { id: 'minesweeper', title: 'Minesweeper', icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23ccc'/%3E%3Ccircle cx='16' cy='16' r='6' fill='black'/%3E%3C/svg%3E" },
        { id: 'msn', title: 'Messenger', icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='12' fill='%2300cc00'/%3E%3C/svg%3E" },
        { id: 'control-panel', title: 'Control Panel', icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='4' y='4' width='24' height='24' fill='%23808080'/%3E%3Crect x='8' y='8' width='6' height='6' fill='white'/%3E%3Crect x='18' y='8' width='6' height='6' fill='white'/%3E%3Crect x='8' y='18' width='6' height='6' fill='white'/%3E%3Crect x='18' y='18' width='6' height='6' fill='white'/%3E%3C/svg%3E" }
    ];

    newItems.forEach((item, index) => {
        if (!document.getElementById(`icon-${item.id}`)) {
            const div = document.createElement('div');
            div.className = 'desktop-icon';
            div.dataset.window = item.id;
            div.id = `icon-${item.id}`;
            div.innerHTML = `<img src="${item.icon}" alt="${item.title}"><span>${item.title}</span>`;
            iconGrid.appendChild(div);

            div.addEventListener('dblclick', () => openWindowById(item.id));
            div.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
                div.classList.add('selected');
            });

            const baseCount = 4; // Existing icons
            const totalIndex = baseCount + index;
            const taskbarHeight = 40;
            const iconHeight = 90;
            const availableHeight = window.innerHeight - taskbarHeight - 20;
            const maxIconsPerColumn = Math.floor(availableHeight / iconHeight);
            const column = Math.floor(totalIndex / maxIconsPerColumn);
            const row = totalIndex % maxIconsPerColumn;
            div.style.position = 'absolute';
            div.style.left = (column * 90 + 10) + 'px';
            div.style.top = (row * iconHeight + 10) + 'px';

            if (typeof makeIconDraggable === 'function') {
                makeIconDraggable(div);
            }
        }
    });
})();
// 7. Windows Movie Maker
windowContents['moviemaker'] = {
    title: 'Windows Movie Maker',
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23666'/%3E%3Crect x='4' y='8' width='24' height='16' fill='%23333'/%3E%3Ccircle cx='16' cy='16' r='4' fill='white'/%3E%3C/svg%3E",
    content: `
        <div class="xp-explorer" style="background:#ECE9D8;">
            <div class="explorer-toolbar">
                <button>Tasks</button><button>Collections</button>
            </div>
            <div style="padding:20px; text-align:center;">
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23666'/%3E%3Crect x='4' y='8' width='24' height='16' fill='%23333'/%3E%3Ccircle cx='16' cy='16' r='4' fill='white'/%3E%3C/svg%3E" width="64" style="margin-bottom:20px;">
                <h2>Movie Maker</h2>
                <p>Import your multimedia projects into the timeline.</p>
                <div style="margin-top:20px; border:2px inset #716f64; background:black; height:150px; display:flex; align-items:center; justify-content:center; color:white;">
                    [ Preview Window ]
                </div>
            </div>
        </div>
    `
};

// Clippy Logic
(function initClippy() {
    const clippy = document.createElement('div');
    clippy.id = 'clippy-companion';
    clippy.innerHTML = `
        <div id="clippy-bubble" class="hidden">It looks like you're browsing a portfolio. Would you like help finding Kenneth's skills?</div>
        <img id="clippy-agent" src="clippy.png" alt="Clippy" style="width:100px; height:auto; cursor:grab;">
    `;
    document.body.appendChild(clippy);

    const bubble = clippy.querySelector('#clippy-bubble');
    const agent = clippy.querySelector('#clippy-agent');
    let clippyVoice = null;

    // Pro-Max Disney Sidekick Voice Hunting
    const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();

        // Priority: Natural/Premium MALE voices
        const maleNames = [
            "Microsoft Guy Online (Natural)", // Best on Windows
            "Google US English Male",         // Best on Chrome
            "Google UK English Male",
            "Microsoft David",                // Standard Male
            "Daniel",                         // Apple Male
            "Oliver"                          // Apple Male
        ];

        let selected = null;
        for (const name of maleNames) {
            selected = voices.find(v => v.name.includes(name));
            if (selected) break;
        }

        // If no name match, hunt by generic "Male" + "Natural"
        if (!selected) {
            selected = voices.find(v => (v.name.includes('Natural') || v.name.includes('Premium')) && v.name.toLowerCase().includes('male'));
        }

        // Final fallback: First male voice found, or just the first voice
        clippyVoice = selected || voices.find(v => v.name.toLowerCase().includes('male')) || voices[0];
        console.log("Clippy Sidekick Mode [Activated]:", clippyVoice?.name);
    };

    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    // Track current audio to prevent overlap
    let currentClippyAudio = null;

    window.stopClippyAudio = () => {
        if (currentClippyAudio) {
            currentClippyAudio.pause();
            currentClippyAudio.onended = null;
            currentClippyAudio.currentTime = 0;
            currentClippyAudio = null;
            clippy.classList.remove('talking');
        }
        bubble.classList.add('hidden');
    };

    window.clippySpeak = (text, audioPath) => {
        if (!text) return;
        console.log("Clippy: Speaking local AI audio: " + (audioPath || "Direct Text"));

        window.stopClippyAudio(); // Stop previous
        bubble.classList.remove('hidden'); // Show bubble after stop hides it
        bubble.textContent = text;

        // Function to handle the "talking" animation and cleanup
        const handleAudio = (audioObj) => {
            currentClippyAudio = audioObj;
            audioObj.onplay = () => clippy.classList.add('talking');
            audioObj.onended = () => {
                // Ensure this is still the active audio
                if (currentClippyAudio === audioObj) {
                    clippy.classList.remove('talking');
                    currentClippyAudio = null;
                    setTimeout(() => {
                        if (!clippy.classList.contains('talking')) {
                            bubble.classList.add('hidden');
                        }
                    }, 6000);
                }
            };
            audioObj.play().catch(e => {
                console.warn("Local audio playback blocked, falling back to legacy TTS...", e);
                legacySpeak(text);
            });
        };

        // Priority 1: High-Quality Local AI File
        if (audioPath) {
            const audio = new Audio(audioPath);
            handleAudio(audio);
        } else {
            legacySpeak(text);
        }

        // Legacy Fallback (Old Neural AI logic) if file is missing
        function legacySpeak(text) {
            const encodedText = encodeURIComponent(text);
            const voice = "en-US-BrianMultilingualNeural";
            const proxyUrl = `https://api.vve.me/api/tts?voice=${voice}&text=${encodedText}`;
            const audio = new Audio(proxyUrl);
            handleAudio(audio);
        }
    };

    const phrases = [
        { text: "It looks like you're browsing a portfolio. Would you like help?", audio: "sounds/clippy/welcome.mp3" },
        { text: "Don't forget to check the Recycle Bin for memes!", audio: "sounds/clippy/meme.mp3" },
        { text: "Double-click an icon to open it.", audio: "sounds/clippy/double_click.mp3" },
        { text: "Aarhus is a great city. Did you know that?", audio: "sounds/clippy/aarhus.mp3" },
        { text: "Is there anything else I can do for you?", audio: "sounds/clippy/else.mp3" },
        { text: "Kenneth is an award-winning multimedia creator. Very talented!", audio: "sounds/clippy/talent.mp3" },
        { text: "Need a hand with navigation? Just click around!", audio: "sounds/clippy/navigation.mp3" },
        { text: "I found some secret memes in the recycle bin. Don't tell Kenneth I told you!", audio: "sounds/clippy/meme_secret.mp3" }
    ];

    agent.addEventListener('click', () => {
        const p = phrases[Math.floor(Math.random() * phrases.length)];
        window.clippySpeak(p.text, p.audio);
    });

    // Drag Logic
    let isDragging = false;
    let startX, startY;

    agent.onmousedown = (e) => {
        isDragging = true;
        startX = e.clientX - clippy.offsetLeft;
        startY = e.clientY - clippy.offsetTop;
        agent.style.cursor = 'grabbing';

        const onMouseMove = (ev) => {
            if (!isDragging) return;
            clippy.style.left = (ev.clientX - startX) + 'px';
            clippy.style.top = (ev.clientY - startY) + 'px';
            clippy.style.bottom = 'auto';
            clippy.style.right = 'auto';
        };

        const onMouseUp = () => {
            isDragging = false;
            agent.style.cursor = 'grab';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    // Proactive Idle Logic
    let idleCounter = 0;
    setInterval(() => {
        idleCounter += 5000;
        if (idleCounter >= 45000) { // 45 seconds of relative idle
            const p = phrases[Math.floor(Math.random() * phrases.length)];
            window.clippySpeak(p.text, p.audio);
            idleCounter = 0;
        }
    }, 5000);
    document.addEventListener('mousedown', () => idleCounter = 0);
})();

// Starfield Screensaver Logic
(function initScreensaver() {
    const ss = document.createElement('div');
    ss.id = 'screensaver';
    ss.innerHTML = '<canvas></canvas>';
    document.body.appendChild(ss);

    const canvas = ss.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    let stars = [];
    const starCount = 400;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    for (let i = 0; i < starCount; i++) {
        stars.push({
            x: Math.random() * canvas.width - canvas.width / 2,
            y: Math.random() * canvas.height - canvas.height / 2,
            z: Math.random() * canvas.width
        });
    }

    function draw() {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';

        stars.forEach(star => {
            star.z -= 5;
            if (star.z <= 0) star.z = canvas.width;

            const sx = (star.x / star.z) * canvas.width + canvas.width / 2;
            const sy = (star.y / star.z) * canvas.width + canvas.height / 2;
            const size = (1 - star.z / canvas.width) * 3;

            ctx.beginPath();
            ctx.arc(sx, sy, size, 0, Math.PI * 2);
            ctx.fill();
        });
        requestAnimationFrame(draw);
    }
    draw();

    let idleTime = 0;
    function resetIdle() {
        idleTime = 0;
        ss.style.display = 'none';
    }

    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keydown', resetIdle);
    window.addEventListener('mousedown', resetIdle);

    setInterval(() => {
        idleTime++;
        if (idleTime > 60) { // 60 seconds
        }
    }, 1000);
})();

// Error Accordion Logic
window.startErrorAccordion = function () {
    playSound('error-sound');
    let count = 0;
    const max = 20;
    const interval = setInterval(() => {
        const x = 100 + (count * 20);
        const y = 100 + (count * 20);
        const clone = document.createElement('div');
        clone.className = 'window error-clone';
        clone.style.top = y + 'px';
        clone.style.left = x + 'px';
        clone.style.width = '300px';
        clone.style.height = '150px';
        clone.style.zIndex = zIndexCounter + count;
        clone.innerHTML = `
            <div class="title-bar"><div class="title-bar-text"><span>Error</span></div></div>
            <div class="window-content"><p>An error has occurred. Memory leak detected.</p></div>
        `;
        document.getElementById('windows-container').appendChild(clone);
        count++;
        if (count >= max) {
            clearInterval(interval);
            setTimeout(() => {
                document.querySelectorAll('.error-clone').forEach(e => e.remove());
            }, 3000);
        }
    }, 100);
};

// Welcome Screen Logic
(function initWelcomeScreen() {
    const login = document.createElement('div');
    login.id = 'login-screen';
    login.innerHTML = `
        <div id="login-top"></div>
        <div id="login-center">
            <div class="login-user-card" onclick="document.getElementById('login-screen').remove()">
                <img src="Me-pixel.jpeg" class="login-pfp" style="object-fit: cover; border-radius: 5px;">
                <div class="login-text">
                    <h2>Kenneth</h2>
                    <p>Multimedia Creator</p>
                </div>
            </div>
        </div>
        <div id="login-bottom">
            <div class="login-footer-btn">
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Crect x='2' y='2' width='12' height='12' fill='%23cc0000'/%3E%3C/svg%3E">
                <span>Turn off computer</span>
            </div>
            <div style="opacity:0.6;">After you log on, you can start working.</div>
        </div>
    `;
    document.body.appendChild(login);
})();

// 12. Recycle Bin
windowContents['recycle-bin'] = {
    title: 'Recycle Bin',
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cpath d='M10 12h28v28H10V12z' fill='%233A6EA5' stroke='%23003399' stroke-width='2'/%3E%3Cpath d='M8 12h32M24 12V6M16 6h16' stroke='%23003399' stroke-width='2'/%3E%3C/svg%3E",
    content: `
        <div class="xp-explorer" style="background:white;">
            <div style="padding:10px; border-bottom:1px solid #ACA899; background:#eee; font-size:10px;">1 objects in Recycle Bin</div>
            <div class="explorer-grid">
                <div class="explorer-item" onclick="alert('Recovering system32... just kidding!')">
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cpath d='M6 4v24h20V10l-6-6H6z' fill='white' stroke='black'/%3E%3C/svg%3E">
                    <span>secret_memes.txt</span>
                </div>
            </div>
        </div>
    `
};

// Update Desktop Icons to include Winamp, Error Trigger, and Recycle Bin
(function initMoreIcons() {
    const iconGrid = document.getElementById('icon-grid');
    const newItems = [
        { id: 'winamp', title: 'Winamp', icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23333'/%3E%3C/svg%3E" },
        { id: 'recycle-bin', title: 'Recycle Bin', icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cpath d='M10 12h28v28H10V12z' fill='%233A6EA5' stroke='%23003399' stroke-width='2'/%3E%3Cpath d='M8 12h32M24 12V6M16 6h16' stroke='%23003399' stroke-width='2'/%3E%3C/svg%3E" },
        { id: 'error-trigger', title: 'System Fix', icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Cpath d='M8 1l7 14H1L8 1z' fill='yellow' stroke='black'/%3E%3Ctext x='8' y='13' font-size='10' text-anchor='middle'%3E!%3C/text%3E%3C/svg%3E" }
    ];

    newItems.forEach(item => {
        if (!document.getElementById(`icon-${item.id}`)) {
            const div = document.createElement('div');
            div.className = 'desktop-icon';
            div.dataset.window = item.id;
            div.id = `icon-${item.id}`;
            div.innerHTML = `<img src="${item.icon}" alt="${item.title}"><span>${item.title}</span>`;
            iconGrid.appendChild(div);

            div.addEventListener('dblclick', () => openWindowById(item.id));
            div.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
                div.classList.add('selected');
            });

            const totalIndex = iconGrid.querySelectorAll('.desktop-icon').length - 1;
            div.style.position = 'absolute';
            div.style.left = (Math.floor(totalIndex / 6) * 90 + 10) + 'px';
            div.style.top = ((totalIndex % 6) * 90 + 10) + 'px';

            if (typeof makeIconDraggable === 'function') {
                makeIconDraggable(div);
            }
        }
    });
})();

// 13. Desktop Cleanup Wizard
windowContents['cleanup-wizard'] = {
    title: 'Desktop Cleanup Wizard',
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Ccircle cx='20' cy='20' r='10' stroke='black' stroke-width='2'/%3E%3Cline x1='28' y1='28' x2='40' y2='40' stroke='black' stroke-width='4'/%3E%3C/svg%3E", // Or a wizard icon
    content: `
        <div class="xp-wizard">
            <div class="wizard-side">
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Ccircle cx='20' cy='20' r='10' stroke='black' stroke-width='2'/%3E%3Cline x1='28' y1='28' x2='40' y2='40' stroke='black' stroke-width='4'/%3E%3C/svg%3E" width="48">
            </div>
            <div class="wizard-main">
                <h2 style="font-size:16px; margin-bottom:10px;">Welcome to the Desktop Cleanup Wizard</h2>
                <p>This wizard helps you clean up your desktop by moving unused icons to a folder called Unused Desktop Icons.</p>
                <br>
                <p>The following icons have not been used in the last 60 days:</p>
                <div style="border:1px solid #ACA899; background:white; height:100px; padding:5px; margin-top:10px;">
                    <div style="display:flex; align-items:center; gap:5px; font-size:11px;">
                        <input type="checkbox" checked disabled> <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cpath d='M6 4v24h20V10l-6-6H6z' fill='white' stroke='black'/%3E%3C/svg%3E" width="16"> secret_memes.txt
                    </div>
                </div>
                <div class="wizard-footer">
                    <button class="xp-btn" onclick="alert('Desktop Cleaned!'); closeWindow('cleanup-wizard'); openWindowById('unused-icons')">Finish</button>
                    <button class="xp-btn" onclick="closeWindow('cleanup-wizard')">Cancel</button>
                </div>
            </div>
        </div>
    `
};

// 14. Unused Icons Folder
windowContents['unused-icons'] = {
    title: 'Unused Desktop Icons',
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cpath d='M4 12v24h40V16H24l-4-4H4z' fill='%23FFC000' stroke='%23D49B00' stroke-width='2'/%3E%3C/svg%3E",
    content: '<p style="padding:20px; color:black;">Your unused icons have been successfully moved here!</p>'
};

// Desktop Cleanup Wizard Simulation
setTimeout(() => {
    openWindowById('cleanup-wizard');
    if (window.clippySpeak) window.clippySpeak("Your desktop is looking a bit cluttered. Let me help you with that!", "sounds/clippy/cluttered.mp3");
}, 120000); // 2 minutes

// Windows Update Notification Simulation
setTimeout(() => {
    if (window.clippySpeak) window.clippySpeak("New updates are available for your computer. Check the Control Panel!", "sounds/clippy/updates.mp3");
}, 45000); // 45 seconds

// Desktop Pet (Wandering Cat)
(function initDesktopPet() {
    const pet = document.createElement('img');
    pet.id = 'desktop-pet';
    // Using the local animated cat gif as requested
    pet.src = 'cat.gif';
    pet.title = "Kenneth's Desktop Cat";
    pet.style.display = 'block'; // Ensure it's visible
    document.body.appendChild(pet);

    function move() {
        // Stay within bounds
        const x = Math.random() * (window.innerWidth - 60);
        const y = Math.random() * (window.innerHeight - 100);

        // Only move if not being dragged
        if (pet.style.transition !== 'none') {
            const currentX = parseInt(pet.style.left) || 0;

            // Flip cat: moving right gets scaleX(-1), moving left gets scaleX(1)
            pet.style.transform = x > currentX ? 'scaleX(-1)' : 'scaleX(1)';

            pet.style.left = x + 'px';
            pet.style.top = y + 'px';
        }

        setTimeout(move, 8000 + Math.random() * 5000);
    }

    // Initial position
    pet.style.left = '100px';
    pet.style.top = '100px';

    // Start moving immediately
    move();

    pet.addEventListener('click', () => {
        if (window.clippySpeak) {
            const petPhrases = [
                { text: "Meow! The cat seems to like your portfolio.", audio: "sounds/clippy/cat_like.mp3" },
                { text: "I think the cat is looking for the Recycle Bin.", audio: "sounds/clippy/cat_recycle.mp3" },
                { text: "Watch out! Don't let him step on your windows.", audio: "sounds/clippy/cat_step.mp3" },
                { text: "Does anyone have a digital treat? This cat looks hungry.", audio: "sounds/clippy/cat_treat.mp3" },
                { text: "Shhh! The cat is taking a nap on your desktop.", audio: "sounds/clippy/cat_sleep.mp3" }
            ];
            const p = petPhrases[Math.floor(Math.random() * petPhrases.length)];
            window.clippySpeak(p.text, p.audio);
        }
    });

    // Drag logic
    pet.onmousedown = (e) => {
        e.preventDefault();
        let p3 = e.clientX; let p4 = e.clientY;
        pet.style.transition = 'none';
        document.onmouseup = () => {
            document.onmouseup = null;
            document.onmousemove = null;
            pet.style.transition = 'left 5s linear, top 5s linear';
        };
        document.onmousemove = (me) => {
            const p1 = p3 - me.clientX; const p2 = p4 - me.clientY;
            p3 = me.clientX; p4 = me.clientY;
            pet.style.top = (pet.offsetTop - p2) + "px";
            pet.style.left = (pet.offsetLeft - p1) + "px";
        };
    };
})();

/* --- COMMAND PROMPT --- */
windowContents['cmd'] = {
    title: 'C:\\WINDOWS\\system32\\cmd.exe',
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='black'/%3E%3Cpath d='M4 8l6 6-6 6h4l6-6-6-6H4zM16 26h12v-4H16v4z' fill='white'/%3E%3C/svg%3E",
    content: `
        <div id="cmd-container" onclick="document.getElementById('cmd-input').focus()">
            <div id="cmd-output">
                <p>Microsoft Windows XP [Version 5.1.2600]</p>
                <p>(C) Copyright 1985-2001 Microsoft Corp.</p>
                <br>
                <p>C:\\Documents and Settings\\Kenneth></p>
            </div>
            <div class="cmd-line">
                <span>C:\\Documents and Settings\\Kenneth></span>
                <input type="text" id="cmd-input" autocomplete="off" spellcheck="false">
            </div>
        </div>
    `
};

window.initCmdLogic = function () {
    const input = document.getElementById('cmd-input');
    const output = document.getElementById('cmd-output');
    if (!input || !output) return;

    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            const cmd = this.value.trim();
            this.value = '';
            output.innerHTML += `<p>C:\\Documents and Settings\\Kenneth> ${cmd}</p>`;

            const args = cmd.toLowerCase().split(' ');
            const command = args[0];
            let response = '';

            switch (command) {
                case 'help':
                    response = `<p>Available commands:<br>HELP, DIR, CLS, EXIT, WHOAMI, START [app]</p>`;
                    break;
                case 'dir':
                    response = `<p>Volume in drive C has no label.<br>Directory of C:\\Documents and Settings\\Kenneth<br><br>01/01/2001 <DIR> .<br>01/01/2001 <DIR> ..<br>15/05/2023 <DIR> My Documents<br>10/10/2023 1,337 resume.txt<br><br>1 File(s) 1,337 bytes</p>`;
                    break;
                case 'del':
                case 'rd':
                case 'format':
                    if (cmd.includes('system32') || cmd.includes('/s') || cmd.includes('c:')) {
                        triggerBSOD();
                        return;
                    }
                    response = '<p>Access is denied.</p>';
                    break;
                case 'cls':
                    output.innerHTML = '';
                    break;
                case 'exit':
                    const win = input.closest('.window');
                    if (win) win.remove();
                    return;
                case 'whoami':
                    response = '<p>kenneth\\admin</p>';
                    break;
                case 'start':
                    if (args[1] && windowContents[args[1]]) {
                        openWindowById(args[1]);
                        response = `<p>Starting ${args[1]}...</p>`;
                    } else response = '<p>Usage: start [app name]</p>';
                    break;
                case 'snake':
                    response = '<p>🐍 Launching Snake Easter Egg...</p>';
                    openWindowById('snake');
                    break;
                case '': break;
                default:
                    response = `<p>'${cmd}' is not recognized.</p>`;
            }

            if (command !== 'cls' && response) output.innerHTML += response;
            const container = document.getElementById('cmd-container');
            container.scrollTop = container.scrollHeight;
        }
    });
    input.focus();
};

function triggerBSOD() {
    const bsod = document.createElement('div');
    bsod.id = 'bsod';
    bsod.innerHTML = `
        <div class="bsod-text">
            <p>A problem has been detected and Windows has been shut down to prevent damage to your computer.</p>
            <br>
            <p>DRIVER_IRQL_NOT_LESS_OR_EQUAL</p>
            <br>
            <p>If this is the first time you've seen this Stop error screen, restart your computer. If this screen appears again, follow these steps:</p>
            <p>Check to make sure any new hardware or software is properly installed. If this is a new installation, ask your hardware or software manufacturer for any Windows updates you might need.</p>
            <br>
            <p>Technical information:</p>
            <p>*** STOP: 0x000000D1 (0x00000040, 0x00000002, 0x00000000, 0xF73120AE)</p>
            <br>
            <p>***  gv3.sys - Address F73120AE base at F7300000, DateStamp 3dd991eb</p>
            <br><br>
            <p>Beginning dump of physical memory</p>
            <p>Physical memory dump complete.</p>
            <p>Contact your system administrator or technical support group for further assistance.</p>
        </div>
    `;
    document.body.appendChild(bsod);
    bsod.style.display = 'block';
    document.getElementById('desktop').style.display = 'none';
    document.getElementById('taskbar').style.display = 'none';

    // Restart on interaction
    setTimeout(() => {
        document.body.onclick = () => location.reload();
        document.body.onkeydown = () => location.reload();
    }, 1000);
}


/* ========================================
   ENHANCEMENT PACK - NOTEPAD FUNCTIONS
   ======================================== */
window.saveNote = function () {
    const textarea = document.getElementById('notepad-textarea');
    const status = document.getElementById('notepad-status');
    if (textarea) {
        localStorage.setItem('xp-notepad-content', textarea.value);
        status.textContent = 'Saved! | ' + new Date().toLocaleTimeString();
        if (window.clippySpeak) {
            window.clippySpeak("Your note has been saved! I'll remember it for you.", "sounds/clippy/notepad_save.mp3");
        }
    }
};

window.loadNote = function () {
    const textarea = document.getElementById('notepad-textarea');
    const status = document.getElementById('notepad-status');
    const saved = localStorage.getItem('xp-notepad-content');
    if (textarea && saved) {
        textarea.value = saved;
        status.textContent = 'Loaded! | ' + saved.length + ' characters';
    } else {
        status.textContent = 'No saved notes found';
    }
};

window.clearNote = function () {
    const textarea = document.getElementById('notepad-textarea');
    const status = document.getElementById('notepad-status');
    if (textarea) {
        textarea.value = '';
        localStorage.removeItem('xp-notepad-content');
        status.textContent = 'Cleared!';
    }
};

// Auto-load notes when notepad opens
const originalOpenWindowById = window.openWindowById || openWindowById;
window.openWindowById = function (id) {
    originalOpenWindowById(id);
    if (id === 'notepad-enhanced') {
        setTimeout(() => {
            const saved = localStorage.getItem('xp-notepad-content');
            const textarea = document.getElementById('notepad-textarea');
            if (saved && textarea) {
                textarea.value = saved;
            }
            // Auto-save on typing
            if (textarea) {
                textarea.addEventListener('input', () => {
                    localStorage.setItem('xp-notepad-content', textarea.value);
                    document.getElementById('notepad-status').textContent = 'Autosaved | ' + new Date().toLocaleTimeString();
                });
            }
        }, 100);
    }
    // Clippy comments on specific windows
    if (window.clippySpeak) {
        const windowComments = {
            'notepad-enhanced': { text: "Writing something important? Don't forget to save!", audio: "sounds/clippy/notepad.mp3" },
            'photos': { text: "Nice photos! You have a great eye for composition.", audio: "sounds/clippy/photos.mp3" },
            'winamp': { text: "It really whips the llama's behind! Classic Winamp.", audio: "sounds/clippy/winamp.mp3" },
            'cmd': { text: "Ooh, the command prompt! You must be a power user.", audio: "sounds/clippy/cmd.mp3" }
        };
        if (windowComments[id]) {
            setTimeout(() => {
                window.clippySpeak(windowComments[id].text, windowComments[id].audio);
            }, 500);
        }
    }
};

/* ========================================
   ENHANCEMENT PACK - PHOTO VIEWER
   ======================================== */
window.changePhoto = function (thumb, src) {
    const main = document.getElementById('photo-current');
    const thumbs = document.querySelectorAll('.photo-thumb');
    thumbs.forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
    if (main) {
        main.style.opacity = 0;
        setTimeout(() => {
            main.src = src;
            main.style.opacity = 1;
        }, 150);
    }
    if (window.clippySpeak && Math.random() > 0.7) {
        window.clippySpeak("What a beautiful photo! Kenneth has great taste.", "sounds/clippy/photo_nice.mp3");
    }
};

/* ========================================
   ENHANCEMENT PACK - KEYBOARD SHORTCUTS
   ======================================== */
document.addEventListener('keydown', (e) => {
    // Alt+F4 - Close active window
    if (e.altKey && e.key === 'F4') {
        e.preventDefault();
        const activeWin = document.querySelector('.window.active');
        if (activeWin) {
            const id = activeWin.id.replace('win-', '');
            closeWindow(id);
        }
    }

    // Ctrl+W - Close active window (alternative)
    if (e.ctrlKey && e.key === 'w') {
        e.preventDefault();
        const activeWin = document.querySelector('.window.active');
        if (activeWin) {
            const id = activeWin.id.replace('win-', '');
            closeWindow(id);
        }
    }

    // Windows key - Toggle Start Menu
    if (e.key === 'Meta' || e.key === 'OS') {
        e.preventDefault();
        document.getElementById('start-menu').classList.toggle('hidden');
    }

    // Ctrl+S - Save in notepad
    if (e.ctrlKey && e.key === 's') {
        const notepad = document.getElementById('notepad-textarea');
        if (notepad && document.activeElement === notepad) {
            e.preventDefault();
            saveNote();
        }
    }
});

/* ========================================
   ENHANCEMENT PACK - BOOT SCREEN LOGIC
   ======================================== */
// Play the authentic old PC booting sound immediately
(function initBootSound() {
    const bootSound = new Audio('old-desktop-pc-booting.mp3');
    bootSound.volume = 0.6;

    // Try to play immediately (may be blocked by browser)
    bootSound.play().catch(() => {
        // If blocked, play on first interaction
        const playOnce = () => {
            bootSound.play().catch(() => { });
            document.removeEventListener('click', playOnce);
        };
        document.addEventListener('click', playOnce);
    });
})();

// Hide boot screen after loading completes
setTimeout(() => {
    const bootScreen = document.getElementById('boot-screen');
    if (bootScreen) {
        bootScreen.style.display = 'none';
    }
}, 3000);

/* ========================================
   ENHANCEMENT PACK - CAT WINDOW INTERACTION
   ======================================== */
(function enhanceCatBehavior() {
    const checkCatOnWindow = () => {
        const pet = document.getElementById('desktop-pet');
        if (!pet) return;

        const petRect = pet.getBoundingClientRect();
        const petCenter = {
            x: petRect.left + petRect.width / 2,
            y: petRect.top + petRect.height / 2
        };

        let onWindow = false;
        Object.values(windows).forEach(win => {
            if (win.classList.contains('hidden')) return;
            const winRect = win.getBoundingClientRect();
            if (petCenter.x >= winRect.left && petCenter.x <= winRect.right &&
                petCenter.y >= winRect.top && petCenter.y <= winRect.bottom) {
                onWindow = true;
            }
        });

        pet.classList.toggle('on-window', onWindow);
    };

    // Check every second
    setInterval(checkCatOnWindow, 1000);

    // Occasionally make cat knock over a window
    setInterval(() => {
        if (Math.random() > 0.95) { // 5% chance
            const pet = document.getElementById('desktop-pet');
            const openWindows = Object.values(windows).filter(w => !w.classList.contains('hidden'));

            if (pet && openWindows.length > 0 && pet.classList.contains('on-window')) {
                const randomWin = openWindows[Math.floor(Math.random() * openWindows.length)];
                pet.classList.add('knocking');
                setTimeout(() => pet.classList.remove('knocking'), 500);

                randomWin.classList.add('shaking');
                setTimeout(() => randomWin.classList.remove('shaking'), 400);

                if (window.clippySpeak) {
                    window.clippySpeak("Oh no! The cat knocked over a window! Classic cat behavior.", "sounds/clippy/cat_knock.mp3");
                }
            }
        }
    }, 15000);
})();

/* ========================================
   ENHANCEMENT PACK - ADD NEW DESKTOP ICONS
   ======================================== */
(function addEnhancementIcons() {
    const iconGrid = document.getElementById('icon-grid');
    const newItems = [
        { id: 'notepad-enhanced', title: 'Notepad', icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Cpath d='M2 2h12v12H2V2z' fill='white' stroke='black'/%3E%3Cline x1='4' y1='5' x2='10' y2='5' stroke='black'/%3E%3Cline x1='4' y1='8' x2='12' y2='8' stroke='black'/%3E%3C/svg%3E" },
        { id: 'photos', title: 'My Pictures', icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='4' y='4' width='24' height='24' fill='%23333' rx='2'/%3E%3Crect x='6' y='6' width='20' height='16' fill='%23666'/%3E%3Ccircle cx='12' cy='12' r='3' fill='%23ffcc00'/%3E%3Cpath d='M6 18l6-4 4 3 6-5v10H6z' fill='%2300aa00'/%3E%3C/svg%3E" }
    ];

    newItems.forEach(item => {
        if (!document.getElementById(`icon-${item.id}`)) {
            const div = document.createElement('div');
            div.className = 'desktop-icon';
            div.dataset.window = item.id;
            div.id = `icon-${item.id}`;
            div.innerHTML = `<img src="${item.icon}" alt="${item.title}"><span>${item.title}</span>`;
            iconGrid.appendChild(div);

            div.addEventListener('dblclick', () => openWindowById(item.id));
            div.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
                div.classList.add('selected');
            });

            const totalIndex = iconGrid.querySelectorAll('.desktop-icon').length - 1;
            div.style.position = 'absolute';
            div.style.left = (Math.floor(totalIndex / 6) * 90 + 10) + 'px';
            div.style.top = ((totalIndex % 6) * 90 + 10) + 'px';

            if (typeof makeIconDraggable === 'function') {
                makeIconDraggable(div);
            }
        }
    });
})();

/* ========================================
   ENHANCEMENT PACK - WINDOW CLOSE ANIMATION
   ======================================== */
const originalCloseWindow = window.closeWindow;
window.closeWindow = function (id) {
    // Stop any ongoing Clippy narration when a window closes
    if (window.stopClippyAudio) window.stopClippyAudio();

    // Extra cleanup for Snake if closed via window controls
    if (id === 'snake' && window.snakeKeyHandler) {
        window.removeEventListener('keydown', window.snakeKeyHandler);
    }

    const win = windows[id];
    if (win) {
        win.classList.add('closing');
        // Clippy sometimes says goodbye
        if (window.clippySpeak && Math.random() > 0.8) {
            window.clippySpeak("Goodbye, window! See you next time.", "sounds/clippy/window_close.mp3");
        }
        setTimeout(() => {
            originalCloseWindow(id);
        }, 150);
    } else {
        originalCloseWindow(id);
    }
};

/* ========================================
   ENHANCEMENT PACK V2 - CALCULATOR LOGIC
   ======================================== */
let calcDisplay = '0';
let calcOperator = null;
let calcPrevValue = null;
let calcNewNumber = true;

window.calcNum = function (num) {
    if (calcNewNumber) {
        calcDisplay = num;
        calcNewNumber = false;
    } else {
        calcDisplay = calcDisplay === '0' ? num : calcDisplay + num;
    }
    updateCalcDisplay();
};

window.calcOp = function (op) {
    if (calcPrevValue === null) {
        calcPrevValue = parseFloat(calcDisplay);
    } else if (!calcNewNumber) {
        calcEquals();
        calcPrevValue = parseFloat(calcDisplay);
    }
    calcOperator = op;
    calcNewNumber = true;
};

window.calcEquals = function () {
    if (calcOperator && calcPrevValue !== null) {
        const current = parseFloat(calcDisplay);
        let result;
        switch (calcOperator) {
            case '+': result = calcPrevValue + current; break;
            case '-': result = calcPrevValue - current; break;
            case '*': result = calcPrevValue * current; break;
            case '/': result = current !== 0 ? calcPrevValue / current : 'Error'; break;
        }
        calcDisplay = String(result);
        calcPrevValue = null;
        calcOperator = null;
        calcNewNumber = true;
        updateCalcDisplay();
    }
};

window.calcClear = function () {
    calcDisplay = '0';
    calcOperator = null;
    calcPrevValue = null;
    calcNewNumber = true;
    updateCalcDisplay();
};

window.calcBackspace = function () {
    calcDisplay = calcDisplay.length > 1 ? calcDisplay.slice(0, -1) : '0';
    updateCalcDisplay();
};

function updateCalcDisplay() {
    const display = document.getElementById('calc-display');
    if (display) display.textContent = calcDisplay;
}

/* ========================================
   ENHANCEMENT PACK V2 - SNAKE GAME LOGIC
   ======================================== */
let snakeGame = null;

window.startSnake = function () {
    const canvas = document.getElementById('snake-canvas');
    if (!canvas) return;

    // Ensure focus for key events
    canvas.setAttribute('tabindex', '0');
    canvas.focus();

    const ctx = canvas.getContext('2d');

    const gridSize = 15;
    const tileCount = canvas.width / gridSize;

    let snake = [{ x: 10, y: 10 }];
    let food = { x: 5, y: 5 };
    let dx = 0, dy = 0;
    let score = 0;

    if (snakeGame) clearInterval(snakeGame);

    // Remove old listener if exists to prevent duplicates
    if (window.snakeKeyHandler) {
        window.removeEventListener('keydown', window.snakeKeyHandler);
    }

    // New named handler
    window.snakeKeyHandler = (e) => {
        // Prevent default scrolling for arrow keys
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1) {
            e.preventDefault();
        }

        switch (e.key) {
            case 'ArrowUp': if (dy !== 1) { dx = 0; dy = -1; } break;
            case 'ArrowDown': if (dy !== -1) { dx = 0; dy = 1; } break;
            case 'ArrowLeft': if (dx !== 1) { dx = -1; dy = 0; } break;
            case 'ArrowRight': if (dx !== -1) { dx = 1; dy = 0; } break;
        }
    };

    window.addEventListener('keydown', window.snakeKeyHandler);

    // Clean up on window close (mutation observer or robust checking)
    // For now, checks inside loop

    snakeGame = setInterval(() => {
        // Check if canvas still exists (window closed?)
        if (!document.getElementById('snake-canvas')) {
            clearInterval(snakeGame);
            window.removeEventListener('keydown', window.snakeKeyHandler);
            return;
        }

        // Move snake
        const head = { x: snake[0].x + dx, y: snake[0].y + dy };

        // Wall collision
        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
            clearInterval(snakeGame);
            window.removeEventListener('keydown', window.snakeKeyHandler);
            if (window.clippySpeak) window.clippySpeak("Game Over! You hit a wall. Your score: " + score);
            return;
        }

        // Self collision
        for (let segment of snake) {
            if (head.x === segment.x && head.y === segment.y) {
                clearInterval(snakeGame);
                window.removeEventListener('keydown', window.snakeKeyHandler);
                if (window.clippySpeak) window.clippySpeak("Oops! You ate yourself. Score: " + score);
                return;
            }
        }

        snake.unshift(head);

        // Food collision
        if (head.x === food.x && head.y === food.y) {
            score++;
            const scoreEl = document.getElementById('snake-score');
            if (scoreEl) scoreEl.textContent = score;
            food = {
                x: Math.floor(Math.random() * tileCount),
                y: Math.floor(Math.random() * tileCount)
            };
        } else {
            snake.pop();
        }

        // Draw
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw snake
        ctx.fillStyle = '#00ff00';
        for (let segment of snake) {
            ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 1, gridSize - 1);
        }

        // Draw food
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 1, gridSize - 1);

    }, 100);

    if (window.clippySpeak) {
        window.clippySpeak("You found a secret! Kenneth hid easter eggs all over this portfolio.", "sounds/clippy/easter_egg.mp3");
    }
};

/* ========================================
   ENHANCEMENT PACK V2 - FILE SYSTEM NAV
   ======================================== */
const fileSystem = {
    root: [
        { name: 'My Documents', type: 'folder', id: 'documents' },
        { name: 'My Pictures', type: 'folder', id: 'pictures' },
        { name: 'My Music', type: 'folder', id: 'music' },
        { name: 'Control Panel', type: 'window', id: 'control-panel' }
    ],
    documents: [
        { name: 'Resume.txt', type: 'file' },
        { name: 'Cover Letter.doc', type: 'file' },
        { name: 'Projects', type: 'folder', id: 'projects' }
    ],
    pictures: [
        { name: 'Me-pixel.jpeg', type: 'image' },
        { name: 'Me-pixel-smile.jpeg', type: 'image' },
        { name: 'sitting-me.jpeg', type: 'image' }
    ],
    music: [
        { name: 'Kenneth - Bass.mp3', type: 'audio' },
        { name: 'Chill Mix.mp3', type: 'audio' }
    ]
};

window.navigateFS = function (folder) {
    const content = document.getElementById('fs-content');
    const path = document.getElementById('fs-path');
    if (!content || !fileSystem[folder]) return;

    path.textContent = folder === 'root' ? 'C:\\' : 'C:\\' + folder.charAt(0).toUpperCase() + folder.slice(1);

    content.innerHTML = fileSystem[folder].map(item => `
        <div class="explorer-item" onclick="${item.type === 'folder' ? `navigateFS('${item.id}')` : item.type === 'window' ? `openWindowById('${item.id}')` : `alert('Opening ${item.name}...')`}">
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E${item.type === 'folder' ? "%3Cpath d='M4 8v16h24V10H16l-2-2H4z' fill='%23ffcc00'/%3E" :
            item.type === 'image' ? "%3Crect x='4' y='4' width='24' height='24' fill='%23fff' stroke='%23666'/%3E%3Ccircle cx='12' cy='12' r='4' fill='%23ffcc00'/%3E%3Cpath d='M4 20l8-6 6 4 10-6v12H4z' fill='%2300aa00'/%3E" :
                "%3Cpath d='M6 4v24h20V10l-6-6H6z' fill='white' stroke='black'/%3E"
        }%3C/svg%3E">
            <span>${item.name}</span>
        </div>
    `).join('');
};

/* ========================================
   ENHANCEMENT PACK V2 - ANALOG CLOCK
   ======================================== */
(function initAnalogClock() {
    const clock = document.createElement('div');
    clock.id = 'analog-clock-widget';
    clock.innerHTML = `
        <div class="clock-face">
            <div class="clock-hand hour" id="hour-hand"></div>
            <div class="clock-hand minute" id="minute-hand"></div>
            <div class="clock-hand second" id="second-hand"></div>
            <div class="clock-center"></div>
        </div>
    `;
    document.body.appendChild(clock);

    function updateClock() {
        const now = new Date();
        const hours = now.getHours() % 12;
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();

        const hourDeg = (hours * 30) + (minutes * 0.5);
        const minuteDeg = minutes * 6;
        const secondDeg = seconds * 6;

        document.getElementById('hour-hand').style.transform = `rotate(${hourDeg}deg)`;
        document.getElementById('minute-hand').style.transform = `rotate(${minuteDeg}deg)`;
        document.getElementById('second-hand').style.transform = `rotate(${secondDeg}deg)`;
    }

    updateClock();
    setInterval(updateClock, 1000);

    // Make draggable
    let isDragging = false;
    let startX, startY;
    clock.onmousedown = (e) => {
        isDragging = true;
        startX = e.clientX - clock.offsetLeft;
        startY = e.clientY - clock.offsetTop;

        document.onmousemove = (ev) => {
            if (!isDragging) return;
            clock.style.left = (ev.clientX - startX) + 'px';
            clock.style.top = (ev.clientY - startY) + 'px';
            clock.style.right = 'auto';
        };

        document.onmouseup = () => {
            isDragging = false;
            document.onmousemove = null;
        };
    };
})();

/* ========================================
   ENHANCEMENT PACK V2 - DIAL-UP SOUND FOR IE
   ======================================== */
const originalOpenWindowByIdV2 = window.openWindowById;
window.openWindowById = function (id) {
    originalOpenWindowByIdV2(id);

    // Play dial-up sound when opening IE
    if (id === 'ie') {
        const dialUp = new Audio('https://www.soundboard.com/handler/DownLoadTrack.ashx?cliptitle=Dial+Up+Modem&filename=mz/Mzg1ODMxNTIzMzg1ODM3_JzthsfvUY24.mp3');
        dialUp.volume = 0.3;
        dialUp.play().catch(() => { });
    }
};

/* ========================================
   ENHANCEMENT PACK V2 - ADD NEW ICONS
   ======================================== */
(function addV2Icons() {
    const iconGrid = document.getElementById('icon-grid');
    const newItems = [
        { id: 'calculator', title: 'Calculator', icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='4' y='2' width='24' height='28' fill='%23ECE9D8' stroke='%23716F64'/%3E%3Crect x='6' y='4' width='20' height='8' fill='%2398FF98'/%3E%3C/svg%3E" },
        { id: 'weather', title: 'Weather', icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='14' r='6' fill='%23FFD700'/%3E%3C/svg%3E" },
        { id: 'skills-enhanced', title: 'My Skills', icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='4' y='4' width='24' height='24' fill='%23808080'/%3E%3Crect x='8' y='8' width='16' height='3' fill='%2300ff00'/%3E%3C/svg%3E" }
    ];

    newItems.forEach(item => {
        if (!document.getElementById(`icon-${item.id}`)) {
            const div = document.createElement('div');
            div.className = 'desktop-icon';
            div.dataset.window = item.id;
            div.id = `icon-${item.id}`;
            div.innerHTML = `<img src="${item.icon}" alt="${item.title}"><span>${item.title}</span>`;
            iconGrid.appendChild(div);

            div.addEventListener('dblclick', () => openWindowById(item.id));
            div.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
                div.classList.add('selected');
            });

            const totalIndex = iconGrid.querySelectorAll('.desktop-icon').length - 1;
            div.style.position = 'absolute';
            div.style.left = (Math.floor(totalIndex / 6) * 90 + 10) + 'px';
            div.style.top = ((totalIndex % 6) * 90 + 10) + 'px';

            if (typeof makeIconDraggable === 'function') {
                makeIconDraggable(div);
            }
        }
    });
})();

/* ========================================
   ENHANCEMENT PACK V2 - SNAKE EASTER EGG IN CMD
   ======================================== */
const originalCmdLogic = window.initCmdLogic;
window.initCmdLogic = function () {
    if (originalCmdLogic) originalCmdLogic();

    const input = document.getElementById('cmd-input');
    const output = document.getElementById('cmd-output');
    if (!input || !output) return;

    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            const cmd = this.value.trim().toLowerCase();
            if (cmd === 'snake') {
                output.innerHTML += `<p>C:\\> ${cmd}</p><p>🐍 Launching Snake Easter Egg...</p>`;
                openWindowById('snake');
            }
        }
    });
};

/* ========================================
   ENHANCEMENT PACK V2 - UPDATE MSN WITH SOCIALS
   ======================================== */
// Enhance MSN window with social links
windowContents['msn'].content = `
    <div class="msn-win">
        <div class="msn-header">
            <img src="Me-pixel-smile.jpeg" class="msn-pfp" style="object-fit: cover;">
            <div>
                <div style="font-weight:bold;">Kenneth (Online)</div>
                <div style="font-size:9px; color:#666;">I'm a multimedia creator!</div>
            </div>
        </div>
        <div class="msn-contact-list">
            <div class="msn-group">Social Links</div>
            <div class="msn-contact" onclick="window.open('https://linkedin.com/in/kenneth', '_blank')">
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect width='16' height='16' rx='2' fill='%230077B5'/%3E%3Cpath d='M4 6v6h2V6H4zm1-3a1 1 0 100 2 1 1 0 000-2zM7 6v6h2V9c0-1 .5-1.5 1.2-1.5.8 0 .8.7.8 1.5v3h2V8.5c0-2-1-2.5-2-2.5-1 0-1.5.5-2 1V6H7z' fill='white'/%3E%3C/svg%3E" class="msn-status"> 
                <span>LinkedIn</span>
            </div>
            <div class="msn-contact" onclick="window.open('https://github.com/kenneth', '_blank')">
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='8' fill='%23333'/%3E%3Cpath d='M8 1C4.1 1 1 4.1 1 8c0 3.1 2 5.7 4.8 6.6.4.1.5-.2.5-.4v-1.4c-2 .4-2.4-1-2.4-1-.3-.9-.8-1.1-.8-1.1-.7-.5.1-.5.1-.5.7.1 1.1.8 1.1.8.6 1.1 1.7.8 2.1.6.1-.5.3-.8.5-.9-1.6-.2-3.3-.8-3.3-3.6 0-.8.3-1.5.8-2-.1-.2-.4-1 .1-2 0 0 .6-.2 2 .8.6-.2 1.2-.3 1.8-.3s1.2.1 1.8.3c1.4-1 2-.8 2-.8.4 1 .2 1.8.1 2 .5.5.8 1.2.8 2 0 2.8-1.7 3.4-3.3 3.6.3.2.5.7.5 1.4v2.1c0 .2.1.5.5.4C13 13.7 15 11.1 15 8c0-3.9-3.1-7-7-7z' fill='white'/%3E%3C/svg%3E" class="msn-status">
                <span>GitHub</span>
            </div>
            <div class="msn-contact" onclick="window.open('https://twitter.com/kenneth', '_blank')">
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='8' fill='%231DA1F2'/%3E%3Cpath d='M12 5.5c-.4.2-.8.3-1.2.4.4-.3.8-.7.9-1.2-.4.2-.9.4-1.4.5-.4-.4-1-.7-1.6-.7-1.2 0-2.2 1-2.2 2.2 0 .2 0 .3.1.5-1.8-.1-3.4-1-4.5-2.3-.2.3-.3.7-.3 1.1 0 .8.4 1.4 1 1.8-.4 0-.7-.1-1-.3 0 1 .7 1.8 1.6 2-.2 0-.3.1-.5.1-.1 0-.3 0-.4-.1.3.9 1.1 1.5 2.1 1.5-.8.6-1.7 1-2.8 1h-.5c1 .6 2.2 1 3.4 1 4.1 0 6.3-3.4 6.3-6.3v-.3c.4-.3.8-.7 1-1.2z' fill='white'/%3E%3C/svg%3E" class="msn-status">
                <span>Twitter</span>
            </div>
            <div class="msn-group">Online (3)</div>
            <div class="msn-contact"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='6' fill='%2300cc00'/%3E%3C/svg%3E" class="msn-status"> <span>John (Aarhus)</span></div>
            <div class="msn-contact"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='6' fill='%2300cc00'/%3E%3C/svg%3E" class="msn-status"> <span>Sarah (Client)</span></div>
            <div class="msn-contact"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='6' fill='%2300cc00'/%3E%3C/svg%3E" class="msn-status"> <span>Recruiter</span></div>
        </div>
        <div class="msn-footer">
            <button class="xp-btn" style="width:100%;">Add a Contact</button>
        </div>
    </div>
`;

console.log("🚀 Enhancement Pack V3 (Glass Fix) Loaded!");

// Safety init for icons in case DOMContentLoaded fired early
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => {
        if (window.initDesktopIcons) window.initDesktopIcons();

        // Force Start Menu CSS check
        const cssCheck = document.createElement('style');
        cssCheck.innerHTML = '.menu-item { min-height: 48px !important; }';
        document.head.appendChild(cssCheck);
    }, 100);
}

// DEBUG: ULTIMATE VISIBILITY ENFORCER (Glass Taskbar Fix)
setInterval(() => {
    if (document.body.classList.contains('material-glass')) {
        const tb = document.getElementById('taskbar');
        if (tb) {
            // Apply override if height is missing/collapsed or z-index is broken
            if (!tb.style.height || tb.style.height === 'auto' || tb.offsetHeight < 10 || tb.style.zIndex !== '20000') {
                console.log("Applying Full Glass Taskbar Restoration");
                tb.style.cssText = `
                    background: rgba(40, 60, 110, 0.75) !important;
                    z-index: 20000 !important;
                    display: flex !important;
                    visibility: visible !important;
                    backdrop-filter: none !important;
                    bottom: 0 !important;
                    height: 32px !important;
                    position: fixed !important;
                    left: 0 !important;
                    width: 100% !important;
                    border-top: 1px solid rgba(255,255,255,0.3) !important;
                    overflow: visible !important;
                `;

                // Force children
                Array.from(tb.querySelectorAll('*')).forEach(el => {
                    el.style.visibility = 'visible';
                    el.style.opacity = '1';
                    el.style.zIndex = '20001';
                    el.style.position = 'relative';

                    // Specific visibility boosts (using setProperty for priority)
                    if (el.id === 'start-button') {
                        el.style.setProperty('background', 'rgba(255, 255, 255, 0.2)', 'important');
                        el.style.setProperty('border', '1px solid rgba(255, 255, 255, 0.3)', 'important');
                        el.style.setProperty('border-radius', '0 8px 8px 0', 'important');
                    }
                    if (el.classList.contains('taskbar-item')) {
                        el.style.setProperty('background', 'rgba(255, 255, 255, 0.2)', 'important');
                        el.style.setProperty('border', '1px solid rgba(255, 255, 255, 0.3)', 'important');
                        el.style.setProperty('min-width', '100px', 'important');
                        el.style.setProperty('margin', '2px', 'important');
                    }
                    if (el.id === 'taskbar-windows') {
                        el.style.setProperty('display', 'flex', 'important');
                        el.style.setProperty('flex-grow', '1', 'important');
                    }
                });
            }
        }
    }
}, 1000);
