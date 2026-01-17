// Layout Manager
document.addEventListener('DOMContentLoaded', () => {
    injectSidebar();
    injectHeader();
});

function injectSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    sidebar.innerHTML = `
        <div class="h-full bg-slate-900 border-r border-slate-700 flex flex-col w-64 fixed top-0 left-0 z-50">
            <div class="p-6 border-b border-slate-700">
                <h1 class="text-xl font-bold text-blue-400 tracking-wider">KSA SECTORS OPS</h1>
                <p class="text-xs text-slate-400 mt-1">Integrated Control Tower v1.0</p>
            </div>
            
            <nav class="flex-1 overflow-y-auto py-4">
                <ul class="space-y-1 px-3">
                    ${createNavLink('index.html', 'fa-map-marked-alt', 'Command Center')}
                    <li class="border-t border-slate-700 my-2"></li>
                    ${createNavLink('lifecycle.html', 'fa-cogs', 'Engine Room (Lifecycle)')}
                    ${createNavLink('diagnostic.html', 'fa-microscope', 'Diagnostic Lab')}
                </ul>
            </nav>

            <div class="p-4 border-t border-slate-700 bg-slate-800/50">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">A</div>
                    <div>
                        <p class="text-sm font-medium text-slate-200">Admin User</p>
                        <p class="text-xs text-slate-400">System Architect</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function createNavLink(href, icon, text) {
    // Check if current page
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const isActive = currentPath === href;
    
    const activeClass = isActive 
        ? 'bg-blue-600/20 text-blue-400 border-r-2 border-blue-500' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200';

    return `
        <li>
            <a href="${href}" class="flex items-center space-x-3 p-3 rounded-l-md transition-colors ${activeClass}">
                <i class="fas ${icon} w-5 text-center"></i>
                <span class="text-sm font-medium">${text}</span>
            </a>
        </li>
    `;
}

function injectHeader() {
    const header = document.getElementById('header');
    if (!header) return;

    header.innerHTML = `
        <header class="bg-slate-900 border-b border-slate-700 h-16 flex items-center justify-between px-8 fixed top-0 left-64 right-0 z-40">
            <div class="flex items-center space-x-4">
                <h2 id="page-title" class="text-lg font-semibold text-slate-200">Dashboard</h2>
                <span class="px-2 py-0.5 rounded text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">LIVE CONNECTION</span>
            </div>

            <div class="flex items-center space-x-6">
                <!-- Year Filter (Temporal Lock) -->
                <div class="flex items-center space-x-2 bg-slate-800 rounded-md px-3 py-1.5 border border-slate-600">
                    <i class="fas fa-calendar-alt text-slate-400 text-sm"></i>
                    <span class="text-sm text-slate-400">Context Year:</span>
                    <select id="global-year-select" class="bg-transparent text-slate-200 text-sm font-bold focus:outline-none cursor-pointer">
                        <option value="2024" selected>2024</option>
                        <option value="2023">2023</option>
                        <option value="2025">2025</option>
                    </select>
                </div>

                <div class="flex space-x-3 text-slate-400">
                    <button class="hover:text-white"><i class="fas fa-search"></i></button>
                    <button class="hover:text-white"><i class="fas fa-bell"></i></button>
                    <button class="hover:text-white"><i class="fas fa-cog"></i></button>
                </div>
            </div>
        </header>
    `;

    // Initialize Global Event Listener for Year Change
    const yearSelect = document.getElementById('global-year-select');
    if(yearSelect) {
        yearSelect.addEventListener('change', (e) => {
            const year = e.target.value;
            console.log(`Global Year Context Changed to: ${year}`);
            // Dispatch custom event for charts to listen to
            window.dispatchEvent(new CustomEvent('yearChanged', { detail: { year } }));
        });
    }

    // Set page title based on active link logic or simpler lookup
    const path = window.location.pathname.split('/').pop() || 'command-center.html';
    const titleMap = {
        'command-center.html': 'Water Sector Command Center',
        'index.html': 'Water Sector Command Center',
        'lifecycle.html': 'Capability Lifecycle Engine',
        'diagnostic.html': 'Root Cause Diagnostic'
    };
    const titleEl = document.getElementById('page-title');
    if(titleEl) titleEl.textContent = titleMap[path] || 'Dashboard';
}
