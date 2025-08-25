/**
 * QA Automation Dashboard - Refactored Session Cards Implementation
 *
 * Architecture:
 * - Event-driven: Custom events dispatched from Puppeteer (real-time updates)
 * - In-memory storage: All session data kept in memory (no localStorage)
 * - Dashboard persists after evaluation completion (keeps final results)
 * - Individual task sessions: Each task runs in its own session with proper state tracking
 */

// Constants
const TIMING_CONSTANTS = {
    TIMER_UPDATE_INTERVAL: 1000,
    RECOVERY_DELAY_MS: 500,
};

const DOM_SELECTORS = {
    GRID_CONTAINER: "grid-container",
    SESSION_COUNT: "session-count",
    STATE_COUNTS: "state-counts",
    VIEW_MODE_TOGGLE: "view-mode-toggle",
    TEST_FILTER_OVERLAY: "test-filter-overlay",
    TEST_FILTER_LIST: "test-filter-list",
    TEST_SEARCH: "test-search",
    CLEAR_SEARCH: "clear-search",
    SELECT_ALL: "select-all",
    DESELECT_ALL: "deselect-all",
    RUN_SELECTED: "run-selected",
    SELECTED_COUNT: "selected-count",
    SESSION_MODAL: "session-modal",
    MODAL_CLOSE: "modal-close-btn",
    MODAL_SCREENSHOT_CONTAINER: "modal-screenshot-container",
    MODAL_SESSION_INFO: "modal-session-info",
};

const CSS_CLASSES = {
    HIDDEN: "hidden",
    SESSION_CARD: "session-card",
    STATUS_COLUMN: "status-column",
    TASK_ITEM: "task-item",
    FILTER_ITEM: "filter-item",
    FILTER_CHECKBOX: "filter-checkbox",
    STATUS_CHECKBOX: "status-checkbox",
    HIDDEN_BY_SEARCH: "hidden-by-search",
    EMPTY_FILTER_VIEW: "empty-filter-view",
    GRID_MODE: "grid-mode",
    COLUMNS_MODE: "columns-mode",
};

const VIEW_MODES = {
    GRID: "grid",
    COLUMNS: "columns",
};

const SESSION_STATUSES = {
    PENDING: "pending",
    RUNNING: "running",
    COMPLETED: "completed",
    FAILED: "failed",
    ABORTED: "aborted",
};

// SVG Constants
const SVG_ICONS = {
    TIME: `<path d="M6.5 0C5.21442 0 3.95772 0.381218 2.8888 1.09545C1.81988 1.80968 0.986756 2.82484 0.494786 4.01256C0.00281635 5.20028 -0.125905 6.50721 0.124899 7.76809C0.375703 9.02896 0.994767 10.1872 1.90381 11.0962C2.81285 12.0052 3.97104 12.6243 5.23192 12.8751C6.49279 13.1259 7.99973 12.9972 8.98744 12.5052C10.1752 12.0132 11.1903 11.1801 11.9046 10.1112C12.6188 9.04229 13 7.78558 13 6.5C12.9982 4.77665 12.3128 3.12441 11.0942 1.90582C9.87559 0.687224 8.22335 0.00181989 6.5 0ZM6.5 12C5.41221 12 4.34884 11.6774 3.44437 11.0731C2.5399 10.4687 1.83495 9.60975 1.41867 8.60476C1.00238 7.59977 0.893465 6.4939 1.10568 5.427C1.3179 4.36011 1.84173 3.3801 2.61092 2.61091C3.3801 1.84172 4.36011 1.3179 5.42701 1.10568C6.4939 0.893462 7.59977 1.00238 8.60476 1.41866C9.60976 1.83494 10.4687 2.53989 11.0731 3.44436C11.6774 4.34883 12 5.4122 12 6.5C11.9983 7.95818 11.4184 9.35617 10.3873 10.3873C9.35617 11.4184 7.95819 11.9983 6.5 12ZM10.5 6.5C10.5 6.63261 10.4473 6.75979 10.3536 6.85355C10.2598 6.94732 10.1326 7 10 7H6.5C6.36739 7 6.24022 6.94732 6.14645 6.85355C6.05268 6.75979 6 6.63261 6 6.5V3C6 2.86739 6.05268 2.74021 6.14645 2.64645C6.24022 2.55268 6.36739 2.5 6.5 2.5C6.63261 2.5 6.75979 2.55268 6.85356 2.64645C6.94732 2.74021 7 2.86739 7 3V6H10C10.1326 6 10.2598 6.05268 10.3536 6.14645C10.4473 6.24021 10.5 6.36739 10.5 6.5Z" fill="currentColor"/>`,

    CHECKMARK: `<path d="M10.8538 6.14625C10.9002 6.19269 10.9371 6.24783 10.9623 6.30853C10.9874 6.36923 11.0004 6.43429 11.0004 6.5C11.0004 6.56571 10.9874 6.63077 10.9623 6.69147C10.9371 6.75217 10.9002 6.80731 10.8538 6.85375L7.35375 10.3538C7.30732 10.4002 7.25217 10.4371 7.19147 10.4623C7.13077 10.4874 7.06571 10.5004 7 10.5004C6.9343 10.5004 6.86923 10.4874 6.80853 10.4623C6.74783 10.4371 6.69269 10.4002 6.64625 10.3538L5.14625 8.85375C5.05243 8.75993 4.99972 8.63268 4.99972 8.5C4.99972 8.36732 5.05243 8.24007 5.14625 8.14625C5.24007 8.05243 5.36732 7.99972 5.5 7.99972C5.63268 7.99972 5.75993 8.05243 5.85375 8.14625L7 9.29313L10.1463 6.14625C10.1927 6.09976 10.2478 6.06288 10.3085 6.03772C10.3692 6.01256 10.4343 5.99961 10.5 5.99961C10.5657 5.99961 10.6308 6.01256 10.6915 6.03772C10.7522 6.06288 10.8073 6.09976 10.8538 6.14625ZM14.5 8C14.5 9.28558 14.1188 10.5423 13.4046 11.6112C12.6903 12.6801 11.6752 13.5132 10.4874 14.0052C9.29973 14.4972 7.99279 14.6259 6.73192 14.3751C5.47104 14.1243 4.31285 13.5052 3.40381 12.5962C2.49477 11.6872 1.8757 10.529 1.6249 9.26809C1.37409 8.00721 1.50282 6.70028 1.99479 5.51256C2.48676 4.32484 3.31988 3.30968 4.3888 2.59545C5.45772 1.88122 6.71442 1.5 8 1.5C9.72335 1.50182 11.3756 2.18722 12.5942 3.40582C13.8128 4.62441 14.4982 6.27665 14.5 8ZM13.5 8C13.5 6.9122 13.1774 5.84883 12.5731 4.94436C11.9687 4.03989 11.1098 3.33494 10.1048 2.91866C9.09977 2.50238 7.9939 2.39346 6.92701 2.60568C5.86011 2.8179 4.8801 3.34172 4.11092 4.11091C3.34173 4.8801 2.8179 5.86011 2.60568 6.927C2.39347 7.9939 2.50238 9.09977 2.91867 10.1048C3.33495 11.1098 4.0399 11.9687 4.94437 12.5731C5.84884 13.1774 6.91221 13.5 8 13.5C9.45819 13.4983 10.8562 12.9184 11.8873 11.8873C12.9184 10.8562 13.4983 9.45818 13.5 8Z" fill="currentColor"/>`,

    ERROR: `<path d="M14.5 8C14.5 9.28558 14.1188 10.5423 13.4046 11.6112C12.6903 12.6801 11.6752 13.5132 10.4874 14.0052C9.29973 14.4972 7.99279 14.6259 6.73192 14.3751C5.47104 14.1243 4.31285 13.5052 3.40381 12.5962C2.49477 11.6872 1.8757 10.529 1.6249 9.26809C1.37409 8.00721 1.50282 6.70028 1.99479 5.51256C2.48676 4.32484 3.31988 3.30968 4.3888 2.59545C5.45772 1.88122 6.71442 1.5 8 1.5C9.72335 1.50182 11.3756 2.18722 12.5942 3.40582C13.8128 4.62441 14.4982 6.27665 14.5 8ZM13.5 8C13.5 6.9122 13.1774 5.84883 12.5731 4.94436C11.9687 4.03989 11.1098 3.33494 10.1048 2.91866C9.09977 2.50238 7.9939 2.39346 6.92701 2.60568C5.86011 2.8179 4.8801 3.34172 4.11092 4.11091C3.34173 4.8801 2.8179 5.86011 2.60568 6.927C2.39347 7.9939 2.50238 9.09977 2.91867 10.1048C3.33495 11.1098 4.0399 11.9687 4.94437 12.5731C5.84884 13.1774 6.91221 13.5 8 13.5C9.45819 13.4983 10.8562 12.9184 11.8873 11.8873C12.9184 10.8562 13.4983 9.45818 13.5 8Z" fill="currentColor"/>
                        <path d="M10.3536 5.64645C10.5488 5.84171 10.5488 6.15829 10.3536 6.35355L8.70711 8L10.3536 9.64645C10.5488 9.84171 10.5488 10.1583 10.3536 10.3536C10.1583 10.5488 9.84171 10.5488 9.64645 10.3536L8 8.70711L6.35355 10.3536C6.15829 10.5488 5.84171 10.5488 5.64645 10.3536C5.45118 10.1583 5.45118 9.84171 5.64645 9.64645L7.29289 8L5.64645 6.35355C5.45118 6.15829 5.45118 5.84171 5.64645 5.64645C5.84171 5.45118 6.15829 5.45118 6.35355 5.64645L8 7.29289L9.64645 5.64645C9.84171 5.45118 10.1583 5.45118 10.3536 5.64645Z" fill="currentColor"/>`,

    CIRCLE_CHECKMARK: `<path d="M13 6.5C13 7.78558 12.6188 9.04229 11.9046 10.1112C11.1903 11.1801 10.1752 12.0132 8.98744 12.5052C7.79973 12.9972 6.49279 13.1259 5.23192 12.8751C3.97104 12.6243 2.81285 12.0052 1.90381 11.0962C0.994767 10.1872 0.375703 9.02896 0.124899 7.76809C-0.125905 6.50721 0.00281635 5.20028 0.494786 4.01256C0.986756 2.82484 1.81988 1.80968 2.8888 1.09545C3.95772 0.381218 5.21442 0 6.5 0C8.22335 0.00181989 9.87559 0.687224 11.0942 1.90582C12.3128 3.12441 12.9982 4.77665 13 6.5ZM12 6.5C12 5.4122 11.6774 4.34883 11.0731 3.44436C10.4687 2.53989 9.60976 1.83494 8.60476 1.41866C7.59977 1.00238 6.4939 0.893462 5.42701 1.10568C4.36011 1.3179 3.3801 1.84172 2.61092 2.61091C1.84173 3.3801 1.3179 4.36011 1.10568 5.427C0.893465 6.4939 1.00238 7.59977 1.41867 8.60476C1.83495 9.60975 2.5399 10.4687 3.44437 11.0731C4.34884 11.6774 5.41221 12 6.5 12C7.95819 11.9983 9.35617 11.4184 10.3873 10.3873C11.4184 9.35617 11.9983 7.95818 12 6.5ZM9.35375 4.64625C9.40024 4.69269 9.43712 4.74783 9.46228 4.80853C9.48745 4.86923 9.5004 4.93429 9.5004 5C9.5004 5.06571 9.48745 5.13077 9.46228 5.19147C9.43712 5.25217 9.40024 5.30731 9.35375 5.35375L5.85375 8.85375C5.80732 8.90024 5.75217 8.93712 5.69147 8.96228C5.63077 8.98744 5.56571 9.00039 5.5 9.00039C5.4343 9.00039 5.36923 8.98744 5.30853 8.96228C5.24783 8.93712 5.19269 8.90024 5.14625 8.85375L3.64625 7.35375C3.55243 7.25993 3.49972 7.13268 3.49972 7C3.49972 6.86732 3.55243 6.74007 3.64625 6.64625C3.74007 6.55243 3.86732 6.49972 4 6.49972C4.13268 6.49972 4.25993 6.55243 4.35375 6.64625L5.5 7.79313L8.64625 4.64625C8.69269 4.59976 8.74783 4.56288 8.80853 4.53772C8.86923 4.51256 8.9343 4.49961 9 4.49961C9.06571 4.49961 9.13077 4.51256 9.19147 4.53772C9.25217 4.56288 9.30732 4.59976 9.35375 4.64625Z"/>`,

    CIRCLE_DOTS: `<path d="M13 6.5C13 7.78558 12.6188 9.04229 11.9046 10.1112C11.1903 11.1801 10.1752 12.0132 8.98744 12.5052C7.79973 12.9972 6.49279 13.1259 5.23192 12.8751C3.97104 12.6243 2.81285 12.0052 1.90381 11.0962C0.994767 10.1872 0.375703 9.02896 0.124899 7.76809C-0.125905 6.50721 0.00281635 5.20028 0.494786 4.01256C0.986756 2.82484 1.81988 1.80968 2.8888 1.09545C3.95772 0.381218 5.21442 0 6.5 0C8.22335 0.00181989 9.87559 0.687224 11.0942 1.90582C12.3128 3.12441 12.9982 4.77665 13 6.5ZM12 6.5C12 5.4122 11.6774 4.34883 11.0731 3.44436C10.4687 2.53989 9.60976 1.83494 8.60476 1.41866C7.59977 1.00238 6.4939 0.893462 5.42701 1.10568C4.36011 1.3179 3.3801 1.84172 2.61092 2.61091C1.84173 3.3801 1.3179 4.36011 1.10568 5.427C0.893465 6.4939 1.00238 7.59977 1.41867 8.60476C1.83495 9.60975 2.5399 10.4687 3.44437 11.0731C4.34884 11.6774 5.41221 12 6.5 12C7.95819 11.9983 9.35617 11.4184 10.3873 10.3873C11.4184 9.35617 11.9983 7.95818 12 6.5ZM1.5 6.5C1.5 6.77614 1.72386 7 2 7C2.27614 7 2.5 6.77614 2.5 6.5C2.5 6.22386 2.27614 6 2 6C1.72386 6 1.5 6.22386 1.5 6.5ZM10.5 6.5C10.5 6.77614 10.7239 7 11 7C11.2761 7 11.5 6.77614 11.5 6.5C11.5 6.22386 11.2761 6 11 6C10.7239 6 10.5 6.22386 10.5 6.5Z"/>`,

    SEARCH: `<path opacity="0.4" d="M38.25 64.5C52.7475 64.5 64.5 52.7475 64.5 38.25C64.5 23.7525 52.7475 12 38.25 12C23.7525 12 12 23.7525 12 38.25C12 52.7475 23.7525 64.5 38.25 64.5Z" fill="#D7E1FF"/>
                    <path d="M47 15.5H68" stroke="#2D6DF6" stroke-width="5.25" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M47 25.998H57.5" stroke="#2D6DF6" stroke-width="5.25" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M71.5 38.25C71.5 56.625 56.625 71.5 38.25 71.5C19.875 71.5 5 56.625 5 38.25C5 19.875 19.875 5 38.25 5" stroke="#2D6DF6" stroke-width="5.25" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M75 75L68 68" stroke="#2D6DF6" stroke-width="5.25" stroke-linecap="round" stroke-linejoin="round"/>`,

    WAITING_PLACEHOLDER: `<path fill-rule="evenodd" clip-rule="evenodd" d="M93.857 59.7554H31.5134C28.8648 59.7554 26.7177 57.6083 26.7177 54.9598C26.7177 52.3112 28.8648 50.1641 31.5134 50.1641H4.79469C2.14611 50.1641 -0.000976562 48.017 -0.000976562 45.3685C-0.000976563 42.7199 2.14611 40.5728 4.79469 40.5728H32.1985C34.847 40.5728 36.9941 38.4257 36.9941 35.7771C36.9941 33.1286 34.847 30.9815 32.1985 30.9815H15.0711C12.4225 30.9815 10.2754 28.8344 10.2754 26.1858C10.2754 23.5372 12.4225 21.3902 15.0711 21.3902H42.4749C39.8263 21.3902 37.6792 19.2431 37.6792 16.5945C37.6792 13.9459 39.8263 11.7988 42.4749 11.7988H81.5253C84.1738 11.7988 86.3209 13.9459 86.3209 16.5945C86.3209 19.2431 84.1738 21.3902 81.5253 21.3902H125.371C128.02 21.3902 130.167 23.5372 130.167 26.1858C130.167 28.8344 128.02 30.9815 125.371 30.9815H140.443C143.092 30.9815 145.239 33.1286 145.239 35.7771C145.239 38.4257 143.092 40.5728 140.443 40.5728H127.427C124.778 40.5728 122.631 42.7199 122.631 45.3685C122.631 48.017 124.778 50.1641 127.427 50.1641H131.537C134.186 50.1641 136.333 52.3112 136.333 54.9598C136.333 57.6083 134.186 59.7554 131.537 59.7554H95.9123C95.5595 59.7554 95.2157 59.7174 94.8846 59.6451C94.5536 59.7174 94.2097 59.7554 93.857 59.7554Z" fill="white"/>
                        <circle cx="143.184" cy="54.9597" r="4.79566" fill="white"/>
                        <rect x="34.2529" y="9.12695" width="46.5864" height="46.5864" rx="13.0168" transform="rotate(-10.2532 34.2529 9.12695)" stroke="#2D6DF6" stroke-width="3.42547"/>
                        <rect x="38.6846" y="12.4531" width="39.0504" height="38.4137" rx="10.2764" transform="rotate(-10.2532 38.6846 12.4531)" fill="#D7E1FF"/>
                        <path d="M100.397 47.9534L99.6608 52.9182C98.4901 60.8099 93.1021 64.8187 85.2349 63.6516L67.123 60.9647C61.6117 60.1471 57.979 57.2374 56.7313 52.8424L56.9948 52.7042L68.6899 47.1272C70.5926 46.213 73.0156 46.7054 74.3507 48.2772L74.9955 48.9933C76.4658 50.6959 79.1891 51.0999 81.0904 49.8974L91.2297 43.4914C93.131 42.2889 95.8543 42.6929 97.3246 44.3956L100.397 47.9534Z" fill="#D7E1FF"/>
                        <path d="M96.9384 35.0892L95.0317 33.1909C92.4853 31.6638 94.5456 30.6546 95.0317 27.7315L97.2809 20.7023C97.434 19.7816 95.1308 20.6304 95.5682 20.0172C97.6858 20.3276 95.0311 18.6679 95.0078 18.664L73.4996 15.4185C65.0128 14.0072 59.1227 18.1605 57.7295 26.5385L54.5222 45.8264C54.105 48.3352 54.1844 50.5955 54.7409 52.5802L55.0279 52.4388L67.7623 46.7508C69.8342 45.8181 72.4459 46.3943 73.864 48.0966L74.5496 48.8729C76.1117 50.7174 79.0495 51.206 81.1246 49.9663L92.1902 43.3622C94.2653 42.1225 97.2031 42.6111 98.7652 44.4556L102.03 48.3099L103.982 37.6207C103.982 36.9356 102.955 37.6207 102.955 37.6207C99.8717 36.9356 97.966 35.7743 96.9384 35.0892Z" fill="white"/>
                        <path d="M73.2627 33.5951C75.8202 33.9745 78.2011 32.2088 78.5805 29.6512C78.9599 27.0937 77.1942 24.7129 74.6367 24.3335C72.0791 23.9541 69.6983 25.7198 69.3189 28.2773C68.9395 30.8348 70.7052 33.2157 73.2627 33.5951Z" stroke="#2D6DF6" stroke-width="3.51111" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M85.2721 16.4444L76.0105 15.0704C64.4335 13.353 59.1158 17.2968 57.3983 28.8738L55.3374 42.7662C53.6199 54.3432 57.5637 59.661 69.1407 61.3784L83.0331 63.4394C94.6101 65.1568 99.9279 61.213 101.645 49.636L103.363 38.059" stroke="#2D6DF6" stroke-width="3.51111" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M94.7877 32.0545L96.8486 18.1621L100.792 23.4799" stroke="#2D6DF6" stroke-width="3.51111" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M96.8495 18.1635L91.5318 22.1074" stroke="#2D6DF6" stroke-width="3.51111" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M55.5318 52.1447L68.0837 46.1741C70.0949 45.2183 72.7138 45.7488 74.1482 47.4051L74.8127 48.1899C76.3886 50.0091 79.306 50.4419 81.3421 49.1585L92.2005 42.3215C94.2366 41.0381 97.154 41.4709 98.7299 43.2901L102.023 47.0916" stroke="#2D6DF6" stroke-width="3.51111" stroke-linecap="round" stroke-linejoin="round"/>`,
};

// Utility Functions
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatElapsedTime(elapsedSeconds) {
    if (elapsedSeconds < 60) {
        return `${elapsedSeconds} sec`;
    } else if (elapsedSeconds < 3600) {
        const minutes = Math.floor(elapsedSeconds / 60);
        const seconds = elapsedSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, "0")} min`;
    } else {
        const hours = Math.floor(elapsedSeconds / 3600);
        const minutes = Math.floor((elapsedSeconds % 3600) / 60);
        return `${hours}:${minutes.toString().padStart(2, "0")} hr`;
    }
}

// Timer Manager Class
class TimerManager {
    constructor(dashboard) {
        this.dashboard = dashboard;
        this.runningTimers = new Map();
        this.timerInterval = null;
    }

    start() {
        this.timerInterval = setInterval(() => {
            this.updateRunningTimers();
        }, TIMING_CONSTANTS.TIMER_UPDATE_INTERVAL);
    }

    stop() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    addTimer(sessionUid, sessionData) {
        if (!sessionData.runningStartedAt) return;

        const card = document.querySelector(
            `[data-session-id="${sessionUid}"].${CSS_CLASSES.SESSION_CARD}`
        );
        const cardTimingElement = card?.querySelector(".session-timing");

        const taskItem = document.querySelector(
            `[data-session-id="${sessionUid}"].${CSS_CLASSES.TASK_ITEM}`
        );
        const taskTimingElement = taskItem?.querySelector(".task-timing");

        const elapsedMs = Date.now() - sessionData.runningStartedAt;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        const initialTimeText = formatElapsedTime(elapsedSeconds);

        this.runningTimers.set(sessionUid, {
            startTime: sessionData.runningStartedAt,
            cardElement: cardTimingElement,
            taskElement: taskTimingElement,
            lastDisplayText: initialTimeText,
            status: sessionData.status,
        });

        // Set initial text immediately for session cards (both old and new grid design)
        if (cardTimingElement) {
            cardTimingElement.textContent = initialTimeText;
            cardTimingElement.style.display = "inline"; // Use inline for grid cards
        }

        if (taskTimingElement) {
            taskTimingElement.className = `task-timing task-timing-${sessionData.status}`;
            taskTimingElement.textContent = initialTimeText;
            taskTimingElement.style.display = "block";
        }
    }

    removeTimer(sessionUid) {
        this.runningTimers.delete(sessionUid);
    }

    updateRunningTimers() {
        const now = Date.now();

        // Batch DOM updates to avoid layout thrashing
        const updates = [];

        for (const [sessionUid, timer] of this.runningTimers) {
            const elapsedMs = now - timer.startTime;
            const elapsedSeconds = Math.floor(elapsedMs / 1000);
            const newDisplayText = formatElapsedTime(elapsedSeconds);

            // Only update if the display text has actually changed
            if (newDisplayText !== timer.lastDisplayText) {
                timer.lastDisplayText = newDisplayText;
                updates.push({ timer, newDisplayText, sessionUid });
            }
        }

        // Apply all DOM updates in a single batch
        if (updates.length > 0) {
            updates.forEach(({ timer, newDisplayText, sessionUid }) => {
                if (timer.cardElement) {
                    timer.cardElement.textContent = newDisplayText;
                    timer.cardElement.className = `session-timing ${timer.status}`;
                }

                if (timer.taskElement) {
                    timer.taskElement.textContent = newDisplayText;
                    timer.taskElement.className = `task-timing task-timing-${timer.status}`;
                }

                // Update modal if this session is currently shown in the modal
                if (
                    this.dashboard &&
                    this.dashboard.stateManager.currentModalSessionUid === sessionUid
                ) {
                    const modalTimingContainer = document.getElementById("modal-timing");
                    if (
                        modalTimingContainer &&
                        modalTimingContainer.style.display !== "none"
                    ) {
                        modalTimingContainer.innerHTML = `
                            <svg class="modal-timing-icon" viewBox="0 0 13 13" fill="none">
                                ${SVG_ICONS.TIME}
                            </svg>
                            <span id="modal-timing-text">${newDisplayText}</span>
                        `;
                        modalTimingContainer.className = `modal-timing ${timer.status}`;
                    }
                }
            });
        }
    }

    destroy() {
        this.stop();
        this.runningTimers.clear();
    }
}

// State Manager Class
class StateManager {
    constructor() {
        this.sessionData = new Map();
        this.statusFilters = {
            pending: true,
            running: true,
            completed: true,
            failed: true,
            aborted: true,
        };
        this.viewMode = VIEW_MODES.GRID;
        this.currentModalSessionUid = null;
    }

    addSession(sessionUid, data) {
        this.sessionData.set(sessionUid, data);
    }

    getSession(sessionUid) {
        return this.sessionData.get(sessionUid);
    }

    updateSession(sessionUid, updates) {
        const existing = this.sessionData.get(sessionUid) || {};
        this.sessionData.set(sessionUid, { ...existing, ...updates });
    }

    clearSessions() {
        this.sessionData.clear();
    }

    getSessionsByStatus(status) {
        const sessions = [];
        for (const [uid, data] of this.sessionData) {
            if (data.status === status) {
                sessions.push({ sessionUid: uid, sessionData: data });
            }
        }
        return sessions;
    }

    getTaskCounts() {
        const counts = {
            pending: 0,
            running: 0,
            completed: 0,
            failed: 0,
            aborted: 0,
        };

        for (const [uid, data] of this.sessionData) {
            if (counts.hasOwnProperty(data.status)) {
                counts[data.status]++;
            }
        }
        return counts;
    }

    setViewMode(mode) {
        this.viewMode = mode;
    }

    toggleViewMode() {
        this.viewMode =
            this.viewMode === VIEW_MODES.GRID ? VIEW_MODES.COLUMNS : VIEW_MODES.GRID;
        return this.viewMode;
    }

    setStatusFilter(status, enabled) {
        this.statusFilters[status] = enabled;
    }

    getActiveFilters() {
        return Object.keys(this.statusFilters).filter(
            status => this.statusFilters[status]
        );
    }

    canDisableFilter(status) {
        const activeCount = this.getActiveFilters().length;
        return activeCount > 1 || !this.statusFilters[status];
    }

    destroy() {
        this.sessionData.clear();
    }
}

// Event Handler Class
class EventHandler {
    constructor(dashboard) {
        this.dashboard = dashboard;
        this.boundHandlers = new Map();
    }

    setup() {
        // Dashboard events
        this.addWindowListener("dashboardInit", this.handleDashboardInit.bind(this));
        this.addWindowListener(
            "dashboardRunning",
            this.handleDashboardRunning.bind(this)
        );
        this.addWindowListener("dashboardUpdate", this.handleDashboardUpdate.bind(this));
        this.addWindowListener(
            "dashboardComplete",
            this.handleDashboardComplete.bind(this)
        );
        this.addWindowListener(
            "dashboardAborted",
            this.handleDashboardAborted.bind(this)
        );
        this.addWindowListener("showTestFilter", this.handleShowTestFilter.bind(this));

        // Keyboard events
        this.addDocumentListener("keydown", this.handleKeydown.bind(this));

        // Modal events
        const modalCloseBtn = document.getElementById(DOM_SELECTORS.MODAL_CLOSE);
        if (modalCloseBtn) {
            this.addElementListener(modalCloseBtn, "click", () =>
                this.dashboard.closeModal()
            );
        }

        const modal = document.getElementById(DOM_SELECTORS.SESSION_MODAL);
        if (modal) {
            this.addElementListener(modal, "click", e => {
                if (e.target === modal) {
                    this.dashboard.closeModal();
                }
            });
        }
    }

    addWindowListener(event, handler) {
        window.addEventListener(event, handler);
        this.boundHandlers.set(`window-${event}`, { element: window, event, handler });
    }

    addDocumentListener(event, handler) {
        document.addEventListener(event, handler);
        this.boundHandlers.set(`document-${event}`, {
            element: document,
            event,
            handler,
        });
    }

    addElementListener(element, event, handler) {
        element.addEventListener(event, handler);
        const key = `${element.id || element.className}-${event}`;
        this.boundHandlers.set(key, { element, event, handler });
    }

    handleDashboardInit(event) {
        const sessions = event.detail?.sessions || [];
        const appUid = event.detail?.appUid;
        const apiUrl = event.detail?.apiUrl;
        this.dashboard.initializeSessions(sessions, appUid, apiUrl);
    }

    handleDashboardRunning(event) {
        console.log("dashboardRunning", event);
        const data = event.detail;
        if (data.sessionUid) {
            this.dashboard.markSessionRunning(data.sessionUid);
        }
    }

    handleDashboardUpdate(event) {
        console.log("dashboardUpdate", event);
        const data = event.detail;
        if (data.sessionUid && data.data) {
            this.dashboard.updateSession(data.sessionUid, data.data, data.screenshot);
        }
    }

    handleDashboardComplete(event) {
        console.log("dashboardComplete", event);
        const data = event.detail;
        if (data.sessionUid) {
            this.dashboard.markSessionComplete(data.sessionUid, data.result);
        }
    }

    handleDashboardAborted(event) {
        console.log("dashboardAborted", event);
        const data = event.detail;
        if (data.sessionUid) {
            this.dashboard.markSessionAborted(data.sessionUid);
        }
    }

    handleShowTestFilter(event) {
        console.log("showTestFilter", event);
        const data = event.detail;
        if (data.tests) {
            this.dashboard.showTestFilterUI(data.tests);
        }
    }

    handleKeydown(e) {
        // Ctrl/Cmd+R - Manual refresh
        if ((e.ctrlKey || e.metaKey) && e.key === "r") {
            e.preventDefault();
            this.dashboard.refreshSessions();
            return;
        }

        // Ctrl/Cmd+F - Toggle fullscreen
        if ((e.ctrlKey || e.metaKey) && e.key === "f") {
            e.preventDefault();
            this.dashboard.toggleFullscreen();
            return;
        }

        // ESC key - Close modal
        if (e.key === "Escape") {
            this.dashboard.closeModal();
            return;
        }

        // Auto-focus search in test filter
        const testFilterOverlay = document.getElementById(
            DOM_SELECTORS.TEST_FILTER_OVERLAY
        );
        const isVisible =
            testFilterOverlay &&
            !testFilterOverlay.classList.contains(CSS_CLASSES.HIDDEN);

        if (isVisible) {
            const searchInput = document.getElementById(DOM_SELECTORS.TEST_SEARCH);
            const isPrintableChar =
                e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
            const isNotFocused = document.activeElement !== searchInput;

            if (isPrintableChar && isNotFocused && searchInput) {
                searchInput.focus();
            }
        }
    }

    destroy() {
        for (const [key, { element, event, handler }] of this.boundHandlers) {
            element.removeEventListener(event, handler);
        }
        this.boundHandlers.clear();
    }
}

// UI Renderer Class
class UIRenderer {
    constructor(stateManager) {
        this.stateManager = stateManager;
    }

    createSessionCard(sessionUid, sessionData) {
        const card = document.createElement("div");

        // Use new grid card design when in grid mode
        if (this.stateManager.viewMode === VIEW_MODES.GRID) {
            card.className = `${CSS_CLASSES.SESSION_CARD} grid-card`;
            card.dataset.sessionId = sessionUid;

            card.innerHTML = this.createGridCardHTML(sessionUid, sessionData);
        } else {
            // Keep original design for modal and other contexts
            card.className = CSS_CLASSES.SESSION_CARD;
            card.dataset.sessionId = sessionUid;

            card.innerHTML = this.createOriginalCardHTML(sessionUid, sessionData);
        }

        return card;
    }

    createGridCardHTML(sessionUid, sessionData) {
        const progressPercentage =
            sessionData.totalSteps > 0
                ? Math.min(
                      ((sessionData.currentStep + 1) / sessionData.totalSteps) * 100,
                      100
                  )
                : 0;

        const stepIcon = this.getStepIcon(sessionData.status);
        const placeholderContent = this.getImagePlaceholder(sessionData.status);

        // Show time for sessions that have actually run (not pending)
        const shouldShowTime =
            sessionData.status === SESSION_STATUSES.RUNNING ||
            sessionData.status === SESSION_STATUSES.COMPLETED ||
            sessionData.status === SESSION_STATUSES.FAILED;
        const timeDisplayHTML = shouldShowTime
            ? `
            <div class="time-display">
                <svg class="time-icon" viewBox="0 0 13 13" fill="none">
                    ${SVG_ICONS.TIME}
                </svg>
                <span class="session-timing">${this.getInitialTimeDisplay(sessionData)}</span>
            </div>
        `
            : "";

        return `
            <div class="card-content">
                <div class="card-header">
                    <div class="status-badge ${sessionData.status}">${sessionData.status.charAt(0).toUpperCase() + sessionData.status.slice(1)}</div>
                    ${timeDisplayHTML}
                </div>
                
                <div class="task-info">
                    <div class="task-title">${escapeHtml(sessionData.taskName)}</div>
                    <div class="task-description">${escapeHtml(sessionData.taskDescription)}</div>
                </div>
                
                <div class="step-progress-section">
                    <div class="progress-header">
                        <div class="progress-title">Step progress</div>
                        <div class="progress-count">${sessionData.currentStep + 1} of ${sessionData.totalSteps}</div>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill" style="width: ${progressPercentage}%"></div>
                    </div>
                    <div class="current-step">
                        ${stepIcon ? `<div class="step-icon">${stepIcon}</div>` : ""}
                        <div class="step-text">${escapeHtml(sessionData.stepDescriptions[sessionData.currentStep])}</div>
                    </div>
                </div>
                
                <div class="test-id-section">
                    <div class="test-id-divider"></div>
                    <div class="test-id">ID: ${escapeHtml(sessionData.testId)}</div>
                </div>
            </div>
            
            <div class="card-image">
                <div class="image-content">
                    ${placeholderContent}
                </div>
            </div>
        `;
    }

    createOriginalCardHTML(sessionUid, sessionData) {
        const stepProgressLabel = "Step Progress";

        return `
            <div class="session-info">
                <div class="session-header">
                    <div class="session-test-id">${escapeHtml(sessionData.testId)}</div>
                    <div class="session-status ${sessionData.status}">${sessionData.status}</div>
                </div>
                
                <div class="progress-section">
                    <div class="progress-item">
                        <div class="progress-label">Task Description</div>
                        <div class="task-description">${escapeHtml(sessionData.taskDescription)}</div>
                    </div>
                    
                    <div class="progress-item">
                        <div class="progress-label">${escapeHtml(stepProgressLabel)}</div>
                        <div class="progress-value">
                            <span class="current-step">${sessionData.currentStep + 1}</span> / 
                            <span class="total-steps">${sessionData.totalSteps}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill step-progress"></div>
                        </div>
                        <div class="step-description">${escapeHtml(sessionData.stepDescriptions[sessionData.currentStep])}</div>
                    </div>
                </div>
            </div>
            
            <div class="session-screenshot">
                <div class="session-timing" style="display: none;"></div>
                <div class="screenshot-container">
                    <div class="screenshot-placeholder">
                        ${sessionData.status === SESSION_STATUSES.PENDING ? "Waiting to start..." : "Waiting for screenshot..."}
                    </div>
                </div>
            </div>
        `;
    }

    getInitialTimeDisplay(sessionData) {
        if (sessionData.runningStartedAt && sessionData.runningFinishedAt) {
            // Completed/Failed session - show total time
            const totalMs = sessionData.runningFinishedAt - sessionData.runningStartedAt;
            const totalSeconds = Math.max(0, Math.floor(totalMs / 1000));
            return formatElapsedTime(totalSeconds);
        } else if (sessionData.runningStartedAt) {
            // Running session - show elapsed time
            const elapsedMs = Date.now() - sessionData.runningStartedAt;
            const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
            return formatElapsedTime(elapsedSeconds);
        }
        // Fallback for sessions that should show time but don't have timing data yet
        return "--";
    }

    getStepIcon(status) {
        switch (status) {
            case SESSION_STATUSES.RUNNING:
                return `
                    <div class="spinner-container">
                        <div class="spinner-dots">
                            <div class="spinner-dot"></div>
                            <div class="spinner-dot"></div>
                            <div class="spinner-dot"></div>
                            <div class="spinner-dot"></div>
                            <div class="spinner-dot"></div>
                            <div class="spinner-dot"></div>
                            <div class="spinner-dot"></div>
                            <div class="spinner-dot"></div>
                        </div>
                    </div>
                `;
            case SESSION_STATUSES.COMPLETED:
                return `
                    <svg class="checkmark-icon" viewBox="0 0 16 16" fill="none">
                        ${SVG_ICONS.CHECKMARK}
                    </svg>
                `;
            case SESSION_STATUSES.FAILED:
                return `
                    <svg class="error-icon" viewBox="0 0 16 16" fill="none">
                        ${SVG_ICONS.ERROR}
                    </svg>
                `;
            default:
                return "";
        }
    }

    getImagePlaceholder(status) {
        if (status === SESSION_STATUSES.PENDING || status === SESSION_STATUSES.ABORTED) {
            return `
                <div class="waiting-placeholder">
                    <div>
                        <svg width="148" height="72" viewBox="0 0 148 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                        ${SVG_ICONS.WAITING_PLACEHOLDER}
                        </svg>
                    </div>
                    <div class="placeholder-text">Waiting to start...</div>
                </div>
            `;
        }
        return '<div class="screenshot-placeholder">Waiting for screenshot...</div>';
    }

    updateSessionCard(card, sessionData) {
        const isGridCard = card.classList.contains("grid-card");

        if (isGridCard) {
            this.updateGridCard(card, sessionData);
        } else {
            this.updateOriginalCard(card, sessionData);
        }
    }

    updateGridCard(card, sessionData) {
        // Update status badge
        const statusBadge = card.querySelector(".status-badge");
        if (statusBadge) {
            statusBadge.textContent =
                sessionData.status.charAt(0).toUpperCase() + sessionData.status.slice(1);
            statusBadge.className = `status-badge ${sessionData.status}`;
        }

        // Update task title
        const taskTitle = card.querySelector(".task-title");
        if (taskTitle) {
            taskTitle.textContent = sessionData.taskName;
        }

        // Update task description
        const taskDesc = card.querySelector(".task-description");
        if (taskDesc) {
            taskDesc.textContent = sessionData.taskDescription;
        }

        // Update progress count
        const progressCount = card.querySelector(".progress-count");
        if (progressCount) {
            progressCount.textContent = `${sessionData.currentStep + 1} of ${sessionData.totalSteps}`;
        }

        // Update progress bar
        const progressBarFill = card.querySelector(".progress-bar-fill");
        if (progressBarFill && sessionData.totalSteps > 0) {
            const progressPercentage = Math.min(
                ((sessionData.currentStep + 1) / sessionData.totalSteps) * 100,
                100
            );
            progressBarFill.style.width = `${progressPercentage}%`;
        }

        // Update step icon
        const currentStepContainer = card.querySelector(".current-step");
        const existingStepIcon = card.querySelector(".step-icon");
        const newStepIconContent = this.getStepIcon(sessionData.status);

        if (newStepIconContent) {
            // We need to show an icon
            if (existingStepIcon) {
                // Update existing icon
                existingStepIcon.innerHTML = newStepIconContent;
            } else {
                // Create new icon container
                const stepIconDiv = document.createElement("div");
                stepIconDiv.className = "step-icon";
                stepIconDiv.innerHTML = newStepIconContent;
                currentStepContainer.insertBefore(
                    stepIconDiv,
                    currentStepContainer.firstChild
                );
            }
        } else {
            // We shouldn't show an icon, remove it if it exists
            if (existingStepIcon) {
                existingStepIcon.remove();
            }
        }

        // Update step text
        const stepText = card.querySelector(".step-text");
        if (stepText) {
            stepText.textContent = sessionData.stepDescriptions[sessionData.currentStep];
        }

        // Update test ID
        const testId = card.querySelector(".test-id");
        if (testId) {
            testId.textContent = `ID: ${sessionData.testId}`;
        }
    }

    updateOriginalCard(card, sessionData) {
        // Update test ID
        const testIdEl = card.querySelector(".session-test-id");
        if (testIdEl) testIdEl.textContent = sessionData.testId;

        // Update status
        const statusEl = card.querySelector(".session-status");
        if (statusEl) {
            statusEl.textContent = sessionData.status.toUpperCase();
            statusEl.className = `session-status ${sessionData.status}`;
        }

        // Update progress
        const currentStepEl = card.querySelector(".current-step");
        const totalStepsEl = card.querySelector(".total-steps");
        const stepProgressEl = card.querySelector(".step-progress");
        const stepDescEl = card.querySelector(".step-description");
        const progressLabelEl = card.querySelector(
            ".progress-item:nth-child(2) .progress-label"
        );

        if (currentStepEl) currentStepEl.textContent = sessionData.currentStep + 1;
        if (totalStepsEl) totalStepsEl.textContent = sessionData.totalSteps;
        if (stepDescEl)
            stepDescEl.textContent =
                sessionData.stepDescriptions[sessionData.currentStep];

        if (progressLabelEl) {
            progressLabelEl.textContent = "Step Progress";
        }

        if (stepProgressEl && sessionData.totalSteps > 0) {
            const progress =
                ((sessionData.currentStep + 1) / sessionData.totalSteps) * 100;
            stepProgressEl.style.width = `${Math.min(progress, 100)}%`;
        }

        // Update task description
        const taskDescEl = card.querySelector(".task-description");
        if (taskDescEl) taskDescEl.textContent = sessionData.taskDescription;

        // Update placeholder for pending
        const placeholder = card.querySelector(".screenshot-placeholder");
        if (placeholder && sessionData.status === SESSION_STATUSES.PENDING) {
            placeholder.textContent = "Waiting to start...";
        }
    }

    updateScreenshot(card, screenshotData) {
        // Handle both old and new grid card structures
        let container = card.querySelector(".screenshot-container");

        // For new grid cards, look for .image-content instead
        if (!container) {
            container = card.querySelector(".image-content");
        }

        if (!container) return;

        if (screenshotData && screenshotData.trim()) {
            container.innerHTML = "";

            const img = document.createElement("img");
            img.className = "screenshot-img";

            if (screenshotData.startsWith("data:image/")) {
                img.src = screenshotData;
            } else {
                img.src = `data:image/png;base64,${screenshotData}`;
            }

            img.onerror = () => {
                container.innerHTML =
                    '<div class="screenshot-placeholder">Failed to load screenshot</div>';
            };

            container.appendChild(img);
        } else {
            // Check if this is a grid card with pending/aborted status
            const isGridCard = card.classList.contains("grid-card");
            const sessionUid = card.dataset.sessionId;
            const sessionData = this.stateManager?.getSession?.(sessionUid);

            if (
                isGridCard &&
                sessionData &&
                (sessionData.status === SESSION_STATUSES.PENDING ||
                    sessionData.status === SESSION_STATUSES.ABORTED)
            ) {
                if (!container.querySelector(".waiting-placeholder")) {
                    container.innerHTML = this.getImagePlaceholder(sessionData.status);
                }
            } else {
                if (!container.querySelector(".screenshot-placeholder")) {
                    container.innerHTML =
                        '<div class="screenshot-placeholder">Waiting for screenshot...</div>';
                }
            }
        }
    }

    updateTaskItemScreenshot(taskItem, screenshotData) {
        const container = taskItem.querySelector(".image-content");
        if (!container) return;

        if (screenshotData && screenshotData.trim()) {
            container.innerHTML = "";

            const img = document.createElement("img");
            img.className = "screenshot-img";

            if (screenshotData.startsWith("data:image/")) {
                img.src = screenshotData;
            } else {
                img.src = `data:image/png;base64,${screenshotData}`;
            }

            img.onerror = () => {
                container.innerHTML =
                    '<div class="screenshot-placeholder">Failed to load screenshot</div>';
            };

            container.appendChild(img);
        } else {
            if (!container.querySelector(".screenshot-placeholder")) {
                container.innerHTML =
                    '<div class="screenshot-placeholder">Waiting for screenshot...</div>';
            }
        }
    }

    createTaskItem(sessionUid, sessionData) {
        const taskItem = document.createElement("div");
        taskItem.className = `${CSS_CLASSES.TASK_ITEM} task-item-${sessionData.status}`;
        taskItem.dataset.sessionId = sessionUid;

        const progressPercentage =
            sessionData.totalSteps > 0
                ? Math.min(
                      ((sessionData.currentStep + 1) / sessionData.totalSteps) * 100,
                      100
                  )
                : 0;

        const stepIcon = this.getStepIcon(sessionData.status);
        const placeholderContent = this.getImagePlaceholder(sessionData.status);

        // Show time for sessions that have actually run (not pending)
        const shouldShowTime =
            sessionData.status === SESSION_STATUSES.RUNNING ||
            sessionData.status === SESSION_STATUSES.COMPLETED ||
            sessionData.status === SESSION_STATUSES.FAILED;
        const timeDisplayHTML = shouldShowTime
            ? `
            <div class="time-display">
                <svg class="time-icon" viewBox="0 0 13 13" fill="none">
                    ${SVG_ICONS.TIME}
                </svg>
                <span class="session-timing"></span>
            </div>`
            : "";

        // Use same structure as grid cards but with vertical layout - no status badge in column mode
        taskItem.innerHTML = `
            <div class="card-content">
                <div class="task-info">
                    <div class="task-title-row">
                        <div class="task-title">${escapeHtml(sessionData.taskName)}</div>
                        ${timeDisplayHTML}
                    </div>
                    <div class="task-description">${escapeHtml(sessionData.taskDescription)}</div>
                </div>
                
                <div class="step-progress-section">
                    <div class="progress-header">
                        <div class="progress-title">Step progress</div>
                        <div class="progress-count">${sessionData.currentStep + 1} of ${sessionData.totalSteps}</div>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill" style="width: ${progressPercentage}%"></div>
                    </div>
                    <div class="current-step">
                        ${stepIcon ? `<div class="step-icon">${stepIcon}</div>` : ""}
                        <div class="step-text">${escapeHtml(sessionData.stepDescriptions[sessionData.currentStep])}</div>
                    </div>
                </div>
            </div>
            
            <div class="card-image">
                <div class="image-content">
                    ${placeholderContent}
                </div>
            </div>
            
            <div class="test-id-section">
                <div class="test-id-divider"></div>
                <div class="test-id">ID: ${escapeHtml(sessionData.testId)}</div>
            </div>
        `;

        return taskItem;
    }

    showEmptyFilterView() {
        const container = document.getElementById(DOM_SELECTORS.GRID_CONTAINER);
        if (!container) return;

        let emptyView = container.querySelector(`.${CSS_CLASSES.EMPTY_FILTER_VIEW}`);
        if (emptyView) return;

        const activeFilters = this.stateManager.getActiveFilters();
        let message;

        if (activeFilters.length === 1) {
            message = `No ${activeFilters[0]} tests`;
        } else {
            message = `No tests of status ${activeFilters.join(", ")}`;
        }

        emptyView = document.createElement("div");
        emptyView.className = CSS_CLASSES.EMPTY_FILTER_VIEW;
        emptyView.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    ${SVG_ICONS.SEARCH}
                    </svg>
                </div>
                <div class="empty-state-content">
                    <p class="empty-state-title">No Test of status ${activeFilters.join(" and ")}</p>
                    <p class="empty-state-hint">Try selecting different status filters above</p>
                </div>
            </div>
        `;

        container.appendChild(emptyView);
    }

    hideEmptyFilterView() {
        const emptyView = document.querySelector(`.${CSS_CLASSES.EMPTY_FILTER_VIEW}`);
        if (emptyView) {
            emptyView.remove();
        }
    }

    updateGridLayout(visibleCount) {
        const container = document.getElementById(DOM_SELECTORS.GRID_CONTAINER);
        if (!container) return;

        container.classList.remove(
            "grid-1-col",
            "grid-2-col",
            "grid-3-col",
            "grid-multi-col"
        );

        if (visibleCount === 1) {
            container.classList.add("grid-1-col");
        } else if (visibleCount === 2) {
            container.classList.add("grid-2-col");
        } else if (visibleCount === 3) {
            container.classList.add("grid-3-col");
        } else if (visibleCount >= 4) {
            container.classList.add("grid-multi-col");
        }
    }

    showError(message) {
        const container = document.getElementById(DOM_SELECTORS.GRID_CONTAINER);
        if (container) {
            container.innerHTML = `
                <div class="dashboard-error">
                    <div>
                        <h3>Dashboard Error</h3>
                        <p>${escapeHtml(message)}</p>
                        <p><small>Dashboard will update automatically when sessions start</small></p>
                    </div>
                </div>
            `;
        }
    }
}

// Main Dashboard Class
class QADashboard {
    constructor() {
        console.log("🎛️ Initializing QA Dashboard...");

        this.stateManager = new StateManager();
        this.timerManager = new TimerManager(this);
        this.uiRenderer = new UIRenderer(this.stateManager);
        this.eventHandler = new EventHandler(this);

        this.checkboxesInitialized = false;
        this.viewModeToggleInitialized = false;
        this.appUid = null;
        this.apiUrl = null;

        this.init();
    }

    init() {
        this.eventHandler.setup();
        this.timerManager.start();
        this.refreshSessions();
        this.uiRenderer.updateGridLayout(0);
    }

    initializeSessions(sessions, appUid, apiUrl) {
        if (!sessions || sessions.length === 0) return;

        // Store appUid and apiUrl, then setup external link
        this.appUid = appUid;
        this.apiUrl = apiUrl;
        this.setupExternalLink();

        // Clear existing data
        this.stateManager.clearSessions();
        this.checkboxesInitialized = false;

        const container = document.getElementById(DOM_SELECTORS.GRID_CONTAINER);
        if (container) {
            // Remove existing session cards without clearing entire container (preserves scroll)
            const existingCards = container.querySelectorAll(
                `.${CSS_CLASSES.SESSION_CARD}`
            );
            existingCards.forEach(card => card.remove());

            container.classList.remove(
                "grid-1-col",
                "grid-2-col",
                "grid-3-col",
                "grid-multi-col"
            );
        }

        // Add new sessions
        sessions.forEach(sessionData => {
            this.stateManager.addSession(sessionData.sessionUid, sessionData);
            this.createSessionCard(sessionData.sessionUid, sessionData);
        });

        this.updateTaskCountsHeader();
        console.log(`📊 Initialized ${sessions.length} sessions in memory`);
    }

    createSessionCard(sessionUid, sessionData) {
        const card = this.uiRenderer.createSessionCard(sessionUid, sessionData);

        const container = document.getElementById(DOM_SELECTORS.GRID_CONTAINER);
        if (container) {
            container.appendChild(card);
        }

        this.populateSessionCard(card, sessionData);

        // Restore screenshot from session data if available
        if (sessionData.screenshot) {
            this.uiRenderer.updateScreenshot(card, sessionData.screenshot);
        }

        card.addEventListener("click", () => {
            this.openModal(sessionUid);
        });

        return card;
    }

    populateSessionCard(card, sessionData) {
        // Track timing
        if (
            sessionData.status === SESSION_STATUSES.RUNNING &&
            !sessionData.runningStartedAt
        ) {
            sessionData.runningStartedAt = Date.now();
        }

        if (
            sessionData.runningStartedAt &&
            sessionData.status !== SESSION_STATUSES.RUNNING &&
            !sessionData.runningFinishedAt
        ) {
            sessionData.runningFinishedAt = Date.now();
        }

        // Update UI
        this.uiRenderer.updateSessionCard(card, sessionData);

        // Manage timers
        const sessionUid = card.dataset.sessionId;
        if (
            sessionData.status === SESSION_STATUSES.RUNNING &&
            sessionData.runningStartedAt
        ) {
            if (!this.timerManager.runningTimers.has(sessionUid)) {
                this.timerManager.addTimer(sessionUid, sessionData);
            }
        } else {
            this.timerManager.removeTimer(sessionUid);

            if (sessionData.runningStartedAt) {
                const timingElement = card.querySelector(".session-timing");
                if (timingElement) {
                    const endTime = sessionData.runningFinishedAt || Date.now();
                    const elapsedMs = endTime - sessionData.runningStartedAt;
                    const elapsedSeconds = Math.floor(elapsedMs / 1000);
                    const timeText = formatElapsedTime(elapsedSeconds);

                    timingElement.textContent = timeText;
                    // Use inline display for grid cards, block for original cards
                    const isGridCard = card.classList.contains("grid-card");
                    timingElement.style.display = isGridCard ? "inline" : "block";
                }
            }
        }
    }

    updateTaskCountsHeader() {
        const totalTasks = this.stateManager.sessionData.size;
        const taskCounts = this.stateManager.getTaskCounts();

        const countElement = document.getElementById(DOM_SELECTORS.SESSION_COUNT);
        if (countElement) {
            countElement.textContent = totalTasks;
        }

        if (!this.checkboxesInitialized) {
            this.initializeStatusCheckboxes();
        }

        if (!this.viewModeToggleInitialized) {
            this.initializeViewModeToggle();
        }

        this.updateStatusCounts(taskCounts);
        this.applyStatusFilter();
    }

    initializeStatusCheckboxes() {
        let stateCountsElement = document.getElementById(DOM_SELECTORS.STATE_COUNTS);

        if (!stateCountsElement) {
            stateCountsElement = document.createElement("div");
            stateCountsElement.id = DOM_SELECTORS.STATE_COUNTS;
            stateCountsElement.className = "state-counts";

            const statusElement = document.querySelector(".status");
            if (statusElement) {
                statusElement.appendChild(stateCountsElement);
            }
        }

        const statuses = Object.values(SESSION_STATUSES); // Use lowercase values instead of uppercase keys

        const checkboxesHtml = statuses
            .map(status => {
                const isChecked = this.stateManager.statusFilters[status]
                    ? "checked"
                    : "";
                const html = `
                <div class="state-count-item">
                    <input type="checkbox" id="filter-${status}" class="${CSS_CLASSES.STATUS_CHECKBOX} ${status}" ${isChecked} />
                    <label for="filter-${status}" class="state-label ${status}">${status.charAt(0).toUpperCase() + status.slice(1)}:</label>
                    <span class="state-value" id="count-${status}">0</span>
                </div>
            `;
                return html;
            })
            .join("");

        stateCountsElement.innerHTML = checkboxesHtml;

        this.setupStatusFilterListeners();
        this.checkboxesInitialized = true;
    }

    initializeViewModeToggle() {
        const viewButtons = document.querySelectorAll(".view-btn");
        viewButtons.forEach(button => {
            button.addEventListener("click", () => {
                const viewMode = button.dataset.view;
                this.setViewMode(viewMode);
            });
        });
        this.viewModeToggleInitialized = true;
    }

    setViewMode(viewMode) {
        if (viewMode === "grid") {
            this.stateManager.viewMode = VIEW_MODES.GRID;
        } else if (viewMode === "columns") {
            this.stateManager.viewMode = VIEW_MODES.COLUMNS;
        }

        this.updateToggleButtonIcons();
        this.applyCurrentLayout();
    }

    toggleViewMode() {
        const newMode = this.stateManager.toggleViewMode();

        this.updateToggleButtonIcons();
        this.applyCurrentLayout();
    }

    updateToggleButtonIcons() {
        const gridButton = document.querySelector('[data-view="grid"]');
        const columnsButton = document.querySelector('[data-view="columns"]');

        if (this.stateManager.viewMode === VIEW_MODES.GRID) {
            gridButton?.classList.add("active");
            columnsButton?.classList.remove("active");
        } else {
            gridButton?.classList.remove("active");
            columnsButton?.classList.add("active");
        }
    }

    applyCurrentLayout() {
        if (this.stateManager.viewMode === VIEW_MODES.GRID) {
            this.applyGridLayout();
        } else {
            this.applyColumnsLayout();
        }
    }

    applyGridLayout() {
        const container = document.getElementById(DOM_SELECTORS.GRID_CONTAINER);
        if (!container) return;

        container.classList.remove(CSS_CLASSES.COLUMNS_MODE);
        container.classList.add(CSS_CLASSES.GRID_MODE);

        // Remove existing columns
        const existingColumns = container.querySelectorAll(
            `.${CSS_CLASSES.STATUS_COLUMN}`
        );
        existingColumns.forEach(col => col.remove());

        // Recreate session cards with new grid design
        const existingCards = container.querySelectorAll(`.${CSS_CLASSES.SESSION_CARD}`);
        existingCards.forEach(card => card.remove());

        // Recreate all session cards with grid design
        for (const [sessionUid, sessionData] of this.stateManager.sessionData) {
            this.createSessionCard(sessionUid, sessionData);
        }

        this.applyStatusFilter();
    }

    applyColumnsLayout() {
        const container = document.getElementById(DOM_SELECTORS.GRID_CONTAINER);
        if (!container) return;

        container.classList.add(CSS_CLASSES.COLUMNS_MODE);
        container.classList.remove(CSS_CLASSES.GRID_MODE);

        // Remove existing grid cards completely when switching to columns
        const cards = container.querySelectorAll(`.${CSS_CLASSES.SESSION_CARD}`);
        cards.forEach(card => card.remove());

        const visibleStatuses = this.stateManager.getActiveFilters();
        const existingColumns = container.querySelectorAll(
            `.${CSS_CLASSES.STATUS_COLUMN}`
        );

        // Remove columns for statuses that are no longer visible
        existingColumns.forEach(col => {
            const columnStatus = col.className.match(/status-column-(\w+)/)?.[1];
            if (columnStatus && !visibleStatuses.includes(columnStatus)) {
                col.remove();
            }
        });

        // Create or update columns for visible statuses in default order
        const defaultOrder = Object.values(SESSION_STATUSES);
        defaultOrder.forEach(status => {
            if (visibleStatuses.includes(status)) {
                const existingColumn = container.querySelector(
                    `.status-column-${status}`
                );
                if (!existingColumn) {
                    this.createStatusColumn(status);
                } else {
                    // Just update the existing column content instead of recreating
                    this.populateStatusColumn(status);
                }
            }
        });
    }

    createStatusColumn(status) {
        const container = document.getElementById(DOM_SELECTORS.GRID_CONTAINER);
        if (!container) return;

        const column = document.createElement("div");
        column.className = `${CSS_CLASSES.STATUS_COLUMN} status-column-${status}`;
        column.innerHTML = `
            <div class="column-header">
                <h3 class="column-title">${status.charAt(0).toUpperCase() + status.slice(1)}</h3>
                <span class="column-count">0</span>
            </div>
            <div class="column-content">
                <!-- Task items will be added here -->
            </div>
        `;

        // Insert column in the correct position based on default status order
        const defaultOrder = Object.values(SESSION_STATUSES);
        const targetIndex = defaultOrder.indexOf(status);
        const existingColumns = container.querySelectorAll(
            `.${CSS_CLASSES.STATUS_COLUMN}`
        );

        // Find the correct insertion point
        let insertBeforeColumn = null;
        for (let i = targetIndex + 1; i < defaultOrder.length; i++) {
            const nextStatus = defaultOrder[i];
            insertBeforeColumn = container.querySelector(`.status-column-${nextStatus}`);
            if (insertBeforeColumn) break;
        }

        if (insertBeforeColumn) {
            container.insertBefore(column, insertBeforeColumn);
        } else {
            container.appendChild(column);
        }

        this.populateStatusColumn(status);
    }

    populateStatusColumn(status) {
        const column = document.querySelector(`.status-column-${status}`);
        if (!column) return;

        const columnContent = column.querySelector(".column-content");
        const columnCount = column.querySelector(".column-count");

        const sessionsWithStatus = this.stateManager.getSessionsByStatus(status);
        columnCount.textContent = sessionsWithStatus.length;

        // Get existing task items in this column
        const existingTaskItems = columnContent.querySelectorAll(
            `.${CSS_CLASSES.TASK_ITEM}`
        );
        const existingSessionIds = new Set(
            Array.from(existingTaskItems).map(item => item.dataset.sessionId)
        );

        // Remove task items for sessions that no longer have this status
        existingTaskItems.forEach(item => {
            const sessionUid = item.dataset.sessionId;
            const stillHasStatus = sessionsWithStatus.some(
                s => s.sessionUid === sessionUid
            );
            if (!stillHasStatus) {
                item.remove();
            }
        });

        // Add or update task items for sessions with this status
        sessionsWithStatus.forEach(({ sessionUid, sessionData }) => {
            let taskItem = columnContent.querySelector(
                `.${CSS_CLASSES.TASK_ITEM}[data-session-id="${sessionUid}"]`
            );

            if (!taskItem) {
                // Create new task item if it doesn't exist
                taskItem = this.uiRenderer.createTaskItem(sessionUid, sessionData);
                taskItem.addEventListener("click", () => {
                    this.openModal(sessionUid);
                });
                columnContent.appendChild(taskItem);

                // Update screenshot if one exists for this session
                const screenshot = this.getCurrentScreenshot(sessionUid);
                if (screenshot) {
                    this.uiRenderer.updateTaskItemScreenshot(taskItem, screenshot);
                }
            } else {
                // Update existing task item in place
                this.updateTaskItemInColumns(sessionUid, sessionData);
            }

            if (sessionData.runningStartedAt) {
                this.updateTaskItemTiming(taskItem, sessionData);
            }
        });
    }

    updateTaskItemTiming(taskItem, sessionData) {
        const timingElement = taskItem.querySelector(".session-timing");
        if (!timingElement) return;

        if (
            sessionData.status === SESSION_STATUSES.RUNNING &&
            sessionData.runningStartedAt
        ) {
            const elapsedMs = Date.now() - sessionData.runningStartedAt;
            const elapsedSeconds = Math.floor(elapsedMs / 1000);
            const timeText = formatElapsedTime(elapsedSeconds);
            timingElement.textContent = timeText;
            timingElement.style.display = "inline";
        } else if (sessionData.runningStartedAt && sessionData.runningFinishedAt) {
            const elapsedMs =
                sessionData.runningFinishedAt - sessionData.runningStartedAt;
            const elapsedSeconds = Math.floor(elapsedMs / 1000);
            const timeText = formatElapsedTime(elapsedSeconds);
            timingElement.textContent = timeText;
            timingElement.style.display = "inline";
        } else if (
            sessionData.runningStartedAt &&
            sessionData.status !== SESSION_STATUSES.RUNNING &&
            sessionData.status !== SESSION_STATUSES.PENDING
        ) {
            const elapsedMs = Date.now() - sessionData.runningStartedAt;
            const elapsedSeconds = Math.floor(elapsedMs / 1000);
            const timeText = formatElapsedTime(elapsedSeconds);
            timingElement.textContent = timeText;
            timingElement.style.display = "inline";
        }
    }

    updateStatusCounts(tasksByState) {
        Object.keys(tasksByState).forEach(status => {
            const element = document.querySelector(`.filter-count.${status}`);
            if (element) {
                element.textContent = tasksByState[status];
            }
        });
    }

    setupStatusFilterListeners() {
        const checkboxes = document.querySelectorAll(
            '.filter-checkbox input[type="checkbox"]'
        );

        checkboxes.forEach(checkbox => {
            checkbox.removeEventListener("change", this.handleStatusFilterChange);
            checkbox.addEventListener("change", this.handleStatusFilterChange.bind(this));
        });
    }

    handleStatusFilterChange(e) {
        e.preventDefault();
        e.stopPropagation();

        const status = e.target.value;
        const isChecked = e.target.checked;

        if (!this.stateManager.canDisableFilter(status) && !isChecked) {
            e.target.checked = true;
            return;
        }

        this.stateManager.setStatusFilter(status, isChecked);
        this.applyStatusFilter();
    }

    handleStatusItemClick(e) {
        if (e.target.type === "checkbox") {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        const checkbox = e.currentTarget.querySelector(`.${CSS_CLASSES.STATUS_CHECKBOX}`);
        if (!checkbox) return;

        const status = checkbox.classList[1];
        const wouldBeChecked = !checkbox.checked;

        if (!this.stateManager.canDisableFilter(status) && !wouldBeChecked) {
            return;
        }

        checkbox.checked = wouldBeChecked;
        this.stateManager.setStatusFilter(status, wouldBeChecked);
        this.applyStatusFilter();
    }

    applyStatusFilter() {
        if (this.stateManager.viewMode === VIEW_MODES.GRID) {
            this.applyGridFilter();
        } else {
            this.applyColumnsFilter();
        }
    }

    applyGridFilter() {
        const cards = document.querySelectorAll(`.${CSS_CLASSES.SESSION_CARD}`);
        let visibleCount = 0;

        cards.forEach(card => {
            const sessionUid = card.dataset.sessionId;
            const sessionData = this.stateManager.getSession(sessionUid);

            if (sessionData && this.stateManager.statusFilters[sessionData.status]) {
                card.style.display = "flex";
                visibleCount++;
            } else {
                card.style.display = "none";
            }
        });

        this.uiRenderer.updateGridLayout(visibleCount);

        if (visibleCount === 0 && this.stateManager.sessionData.size > 0) {
            this.uiRenderer.showEmptyFilterView();
        } else {
            this.uiRenderer.hideEmptyFilterView();
        }
    }

    applyColumnsFilter() {
        // Only rebuild columns if the filter settings have changed
        // For individual session updates, just update the specific task items
        const visibleStatuses = this.stateManager.getActiveFilters();
        const container = document.getElementById(DOM_SELECTORS.GRID_CONTAINER);

        if (container) {
            const existingColumns = container.querySelectorAll(
                `.${CSS_CLASSES.STATUS_COLUMN}`
            );
            const existingStatuses = Array.from(existingColumns)
                .map(col => col.className.match(/status-column-(\w+)/)?.[1])
                .filter(Boolean);

            // Only rebuild layout if the set of visible statuses has changed
            const statusesChanged =
                visibleStatuses.length !== existingStatuses.length ||
                !visibleStatuses.every(status => existingStatuses.includes(status));

            if (statusesChanged) {
                this.applyColumnsLayout();
            } else {
                // Just update existing columns without rebuilding
                visibleStatuses.forEach(status => {
                    this.populateStatusColumn(status);
                });
            }
        }

        this.uiRenderer.hideEmptyFilterView();
    }

    updateTaskItemInColumns(sessionUid, sessionData) {
        const taskItem = document.querySelector(
            `.${CSS_CLASSES.TASK_ITEM}[data-session-id="${sessionUid}"]`
        );
        if (taskItem) {
            this.updateTaskItemTiming(taskItem, sessionData);

            // Update progress bar
            const progressFill = taskItem.querySelector(".progress-bar-fill");
            if (progressFill && sessionData.totalSteps > 0) {
                const stepProgress =
                    ((sessionData.currentStep + 1) / sessionData.totalSteps) * 100;
                progressFill.style.width = `${Math.min(stepProgress, 100)}%`;
            }

            // Update progress count
            const progressCount = taskItem.querySelector(".progress-count");
            if (progressCount) {
                progressCount.textContent = `${sessionData.currentStep + 1} of ${sessionData.totalSteps}`;
            }

            // Status badge removed from column mode - status is shown via column grouping

            // Update step description
            const stepText = taskItem.querySelector(".step-text");
            if (stepText) {
                stepText.textContent =
                    sessionData.stepDescriptions[sessionData.currentStep];
            }

            // Update task description
            const taskDescription = taskItem.querySelector(".task-description");
            if (taskDescription) {
                taskDescription.textContent = sessionData.taskDescription;
            }

            // Update task title
            const taskTitle = taskItem.querySelector(".task-title");
            if (taskTitle) {
                taskTitle.textContent = sessionData.taskName;
            }

            // Update screenshot if available
            if (sessionData.screenshot) {
                this.uiRenderer.updateTaskItemScreenshot(
                    taskItem,
                    sessionData.screenshot
                );
            }

            taskItem.className = `${CSS_CLASSES.TASK_ITEM} task-item-${sessionData.status}`;
        }
    }

    updateSessionCard(sessionUid, sessionData) {
        let card = document.querySelector(`[data-session-id="${sessionUid}"]`);

        if (!card) {
            card = this.createSessionCard(sessionUid, sessionData);
        } else {
            this.populateSessionCard(card, sessionData);
        }

        this.updateModalIfOpen(sessionUid, sessionData);

        if (this.stateManager.viewMode === VIEW_MODES.COLUMNS) {
            this.updateTaskItemInColumns(sessionUid, sessionData);
        }

        this.applyStatusFilter();
    }

    markSessionRunning(sessionUid) {
        const sessionData = this.stateManager.getSession(sessionUid);
        if (sessionData) {
            sessionData.status = SESSION_STATUSES.RUNNING;
            sessionData.lastUpdate = Date.now();
            this.updateSessionCard(sessionUid, sessionData);
            this.updateTaskCountsHeader();
        }
    }

    updateSession(sessionUid, updates, screenshot) {
        // Store screenshot in session data if provided
        if (screenshot) {
            updates = { ...updates, screenshot: screenshot };
        }

        this.stateManager.updateSession(sessionUid, updates);
        const sessionData = this.stateManager.getSession(sessionUid);
        this.updateSessionCard(sessionUid, sessionData);
        this.updateTaskCountsHeader();

        if (screenshot) {
            const card = document.querySelector(
                `[data-session-id="${sessionUid}"].${CSS_CLASSES.SESSION_CARD}`
            );
            if (card) {
                this.uiRenderer.updateScreenshot(card, screenshot);
            }

            // Also update task item screenshot if in column mode
            const taskItem = document.querySelector(
                `[data-session-id="${sessionUid}"].${CSS_CLASSES.TASK_ITEM}`
            );
            if (taskItem) {
                this.uiRenderer.updateTaskItemScreenshot(taskItem, screenshot);
            }
        }
    }

    markSessionComplete(sessionUid, result) {
        const sessionData = this.stateManager.getSession(sessionUid);
        if (sessionData) {
            sessionData.status =
                result?.decision === "PASS"
                    ? SESSION_STATUSES.COMPLETED
                    : SESSION_STATUSES.FAILED;
            sessionData.result = result;
            sessionData.lastUpdate = Date.now();
            this.updateSessionCard(sessionUid, sessionData);
            this.updateTaskCountsHeader();
        }
    }

    markSessionAborted(sessionUid) {
        const sessionData = this.stateManager.getSession(sessionUid);
        if (sessionData) {
            sessionData.status = SESSION_STATUSES.ABORTED;
            sessionData.lastUpdate = Date.now();
            this.updateSessionCard(sessionUid, sessionData);
            this.updateTaskCountsHeader();
        }
    }

    showTestFilterUI(tests) {
        console.log("🎯 Showing test filter UI for tests:", tests);

        const overlay = document.getElementById(DOM_SELECTORS.TEST_FILTER_OVERLAY);
        if (overlay) {
            overlay.classList.remove(CSS_CLASSES.HIDDEN);
        }

        const sortedTests = [...tests].sort((a, b) =>
            a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: "base" })
        );

        const testList = document.getElementById(DOM_SELECTORS.TEST_FILTER_LIST);
        if (testList) {
            testList.innerHTML = "";

            sortedTests.forEach(test => {
                const item = document.createElement("div");
                item.className = CSS_CLASSES.FILTER_ITEM;
                item.innerHTML = `
                    <input type="checkbox" class="${CSS_CLASSES.FILTER_CHECKBOX}" data-test-id="${escapeHtml(test.id)}" checked>
                    <div class="filter-item-info">
                        <div class="filter-item-id">${escapeHtml(test.id)}</div>
                        <div class="filter-item-title">${escapeHtml(test.title)}</div>
                    </div>
                `;
                testList.appendChild(item);
            });
        }

        this.setupFilterEventListeners();
    }

    setupFilterEventListeners() {
        this.updateSelectedCount();

        const searchInput = document.getElementById(DOM_SELECTORS.TEST_SEARCH);
        const clearButton = document.getElementById(DOM_SELECTORS.CLEAR_SEARCH);

        if (searchInput) {
            searchInput.addEventListener("input", () => {
                this.filterTestsBySearch(searchInput.value);
                this.updateClearButtonVisibility(searchInput.value);
            });
        }

        if (clearButton) {
            clearButton.addEventListener("click", () => {
                searchInput.value = "";
                this.filterTestsBySearch("");
                this.updateClearButtonVisibility("");
                searchInput.focus();
            });
        }

        const selectAllBtn = document.getElementById(DOM_SELECTORS.SELECT_ALL);
        const deselectAllBtn = document.getElementById(DOM_SELECTORS.DESELECT_ALL);
        const runSelectedBtn = document.getElementById(DOM_SELECTORS.RUN_SELECTED);

        if (selectAllBtn) {
            selectAllBtn.addEventListener("click", () => {
                const checkboxes = document.querySelectorAll(
                    `.${CSS_CLASSES.FILTER_CHECKBOX}:not(.${CSS_CLASSES.HIDDEN_BY_SEARCH})`
                );
                checkboxes.forEach(cb => (cb.checked = true));
                this.updateSelectedCount();
            });
        }

        if (deselectAllBtn) {
            deselectAllBtn.addEventListener("click", () => {
                const checkboxes = document.querySelectorAll(
                    `.${CSS_CLASSES.FILTER_CHECKBOX}:not(.${CSS_CLASSES.HIDDEN_BY_SEARCH})`
                );
                checkboxes.forEach(cb => (cb.checked = false));
                this.updateSelectedCount();
            });
        }

        if (runSelectedBtn) {
            runSelectedBtn.addEventListener("click", () => {
                this.runSelectedTests();
            });
        }

        const testList = document.getElementById(DOM_SELECTORS.TEST_FILTER_LIST);
        if (testList) {
            testList.addEventListener("change", e => {
                if (e.target.classList.contains(CSS_CLASSES.FILTER_CHECKBOX)) {
                    this.updateSelectedCount();
                }
            });

            testList.addEventListener("click", e => {
                const filterItem = e.target.closest(`.${CSS_CLASSES.FILTER_ITEM}`);
                if (
                    filterItem &&
                    !e.target.classList.contains(CSS_CLASSES.FILTER_CHECKBOX)
                ) {
                    const checkbox = filterItem.querySelector(
                        `.${CSS_CLASSES.FILTER_CHECKBOX}`
                    );
                    if (checkbox) {
                        checkbox.checked = !checkbox.checked;
                        this.updateSelectedCount();
                    }
                }
            });
        }
    }

    updateSelectedCount() {
        const checkboxes = document.querySelectorAll(
            `.${CSS_CLASSES.FILTER_CHECKBOX}:not(.${CSS_CLASSES.HIDDEN_BY_SEARCH})`
        );
        const selectedCount = Array.from(checkboxes).filter(cb => cb.checked).length;

        const countElement = document.getElementById(DOM_SELECTORS.SELECTED_COUNT);
        if (countElement) {
            countElement.textContent = selectedCount;
        }

        const runButton = document.getElementById(DOM_SELECTORS.RUN_SELECTED);
        if (runButton) {
            runButton.disabled = selectedCount === 0;
        }
    }

    filterTestsBySearch(searchText) {
        const searchTerm = searchText.toLowerCase().trim();
        const filterItems = document.querySelectorAll(`.${CSS_CLASSES.FILTER_ITEM}`);

        filterItems.forEach(item => {
            const checkbox = item.querySelector(`.${CSS_CLASSES.FILTER_CHECKBOX}`);
            const testId = item
                .querySelector(".filter-item-id")
                .textContent.toLowerCase();
            const testTitle = item
                .querySelector(".filter-item-title")
                .textContent.toLowerCase();

            const isVisible =
                searchTerm === "" ||
                testId.includes(searchTerm) ||
                testTitle.includes(searchTerm);

            if (isVisible) {
                item.style.display = "";
                checkbox.classList.remove(CSS_CLASSES.HIDDEN_BY_SEARCH);
            } else {
                item.style.display = "none";
                checkbox.classList.add(CSS_CLASSES.HIDDEN_BY_SEARCH);
            }
        });

        this.updateSelectedCount();
    }

    updateClearButtonVisibility(searchText) {
        const clearButton = document.getElementById(DOM_SELECTORS.CLEAR_SEARCH);
        if (clearButton) {
            if (searchText.trim() !== "") {
                clearButton.classList.remove(CSS_CLASSES.HIDDEN);
            } else {
                clearButton.classList.add(CSS_CLASSES.HIDDEN);
            }
        }
    }

    runSelectedTests() {
        const checkboxes = document.querySelectorAll(
            `.${CSS_CLASSES.FILTER_CHECKBOX}:checked`
        );
        const selectedTestIds = Array.from(checkboxes).map(cb => cb.dataset.testId);

        console.log("🚀 [DASHBOARD] User clicked Run Selected Tests:", selectedTestIds);

        const overlay = document.getElementById(DOM_SELECTORS.TEST_FILTER_OVERLAY);
        if (overlay) {
            overlay.classList.add(CSS_CLASSES.HIDDEN);
        }

        window.dispatchEvent(
            new CustomEvent("filterComplete", {
                detail: { selectedTestIds },
            })
        );
    }

    openModal(sessionUid) {
        const sessionData = this.stateManager.getSession(sessionUid);
        if (!sessionData) {
            console.error(`Session data not found for ${sessionUid}`);
            return;
        }

        this.stateManager.currentModalSessionUid = sessionUid;
        const modal = document.getElementById(DOM_SELECTORS.SESSION_MODAL);

        // Update the status badge and timing in the modal
        this.updateModalStatus(sessionData);
        this.updateModalTiming(sessionData);

        this.populateModal(sessionData);

        modal.style.display = "block";
        document.body.style.overflow = "hidden";

        console.log(`📱 Opened modal for session ${sessionUid}`);
    }

    closeModal() {
        const modal = document.getElementById(DOM_SELECTORS.SESSION_MODAL);
        modal.style.display = "none";
        document.body.style.overflow = "auto";
        this.stateManager.currentModalSessionUid = null;
        console.log("📱 Closed modal");
    }

    populateModal(sessionData) {
        const modalSessionInfo = document.getElementById(
            DOM_SELECTORS.MODAL_SESSION_INFO
        );
        const modalScreenshotContainer = document.getElementById(
            DOM_SELECTORS.MODAL_SCREENSHOT_CONTAINER
        );

        const currentScreenshot = this.getCurrentScreenshot(sessionData.sessionUid);
        if (currentScreenshot) {
            modalScreenshotContainer.innerHTML = "";
            const img = document.createElement("img");
            img.className = "screenshot-img";
            img.src = currentScreenshot.startsWith("data:image/")
                ? currentScreenshot
                : `data:image/png;base64,${currentScreenshot}`;
            img.onerror = () => {
                modalScreenshotContainer.innerHTML =
                    '<div class="screenshot-placeholder">Failed to load screenshot</div>';
            };
            modalScreenshotContainer.appendChild(img);
        } else {
            // Use the same fancy placeholder as grid cards
            modalScreenshotContainer.innerHTML = this.uiRenderer.getImagePlaceholder(
                sessionData.status
            );
        }

        // Generate steps list HTML
        const progressPercentage =
            sessionData.totalSteps > 0
                ? Math.min(
                      ((sessionData.currentStep + 1) / sessionData.totalSteps) * 100,
                      100
                  )
                : 0;

        const stepsListHtml = sessionData.stepDescriptions
            .map((stepDescription, index) => {
                let stepState = "future";
                let iconHtml = "";

                if (index < sessionData.currentStep) {
                    stepState = "completed";
                    iconHtml = `<svg class="modal-step-icon step-icon-completed" viewBox="0 0 16 16" fill="currentColor">
                    ${SVG_ICONS.CIRCLE_CHECKMARK}
                </svg>`;
                } else if (index === sessionData.currentStep) {
                    stepState = "current";
                    iconHtml = `<svg class="modal-step-icon step-icon-current" viewBox="0 0 16 16" fill="currentColor">
                    ${SVG_ICONS.CIRCLE_CHECKMARK}
                </svg>`;
                } else {
                    stepState = "future";
                    iconHtml = `<svg class="modal-step-icon step-icon-future" viewBox="0 0 16 16" fill="currentColor">
                    ${SVG_ICONS.CIRCLE_DOTS}
                </svg>`;
                }

                return `
                <div class="modal-step-item">
                    ${iconHtml}
                    <div class="modal-step-text ${stepState}">${escapeHtml(stepDescription)}</div>
                </div>
            `;
            })
            .join("");

        // Generate failure reason section for failed tasks
        let failureReasonHtml = "";
        if (
            sessionData.status === SESSION_STATUSES.FAILED &&
            sessionData.result &&
            sessionData.result.feedbacks &&
            sessionData.result.feedbacks.length > 0
        ) {
            // Get the first feedback's text field as the main failure reason
            const failureText =
                sessionData.result.feedbacks[0].text || "No failure details available";

            failureReasonHtml = `
                <div class="modal-failure-section">
                    <div class="modal-failure-header">
                        <h3 class="modal-failure-title">Failure Reason</h3>
                    </div>
                    <div class="modal-failure-content">
                        <div class="modal-failure-card">
                            <div class="modal-failure-icon">
                                <svg viewBox="0 0 16 16" fill="none">
                                    ${SVG_ICONS.ERROR}
                                </svg>
                            </div>
                            <div class="modal-failure-text">
                                ${escapeHtml(failureText)}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        modalSessionInfo.innerHTML = `
            <div class="modal-task-section">
                <h2 class="modal-task-title">${escapeHtml(sessionData.taskName)}</h2>
                <p class="modal-task-description">${escapeHtml(sessionData.taskDescription)}</p>
            </div>
            
            ${failureReasonHtml}
            
            <div class="modal-steps-section">
                <div class="modal-steps-header">
                    <h3 class="modal-steps-title">Step progress</h3>
                    <p class="modal-steps-count">${sessionData.currentStep + 1} of ${sessionData.totalSteps}</p>
                    <div class="modal-progress-bar-container">
                        <div class="modal-progress-bar-fill" style="width: ${progressPercentage}%"></div>
                    </div>
                </div>
                <div class="modal-steps-list">
                    ${stepsListHtml}
                </div>
            </div>
        `;
    }

    getCurrentScreenshot(sessionUid) {
        const sessionData = this.stateManager.getSession(sessionUid);
        return sessionData?.screenshot || null;
    }

    updateModalIfOpen(sessionUid, sessionData) {
        if (this.stateManager.currentModalSessionUid === sessionUid) {
            this.updateModalStatus(sessionData);
            this.updateModalTiming(sessionData);
            this.populateModal(sessionData);
        }
    }

    updateModalStatus(sessionData) {
        const statusBadge = document.getElementById("modal-status-badge");
        if (statusBadge) {
            statusBadge.className = `modal-status-badge ${sessionData.status}`;
            statusBadge.textContent = sessionData.status.toUpperCase();
        }
    }

    updateModalTiming(sessionData) {
        const timingContainer = document.getElementById("modal-timing");

        // Don't show timing for pending sessions at all
        if (
            !timingContainer ||
            !sessionData.runningStartedAt ||
            sessionData.status === SESSION_STATUSES.PENDING
        ) {
            if (timingContainer) {
                timingContainer.style.display = "none";
            }
            return;
        }

        // Show timing for running/completed/failed sessions
        timingContainer.style.display = "flex";
        timingContainer.className = `modal-timing ${sessionData.status}`;

        // Inject clock icon and update text
        const endTime =
            sessionData.status === SESSION_STATUSES.RUNNING
                ? Date.now()
                : sessionData.runningFinishedAt || Date.now();
        const elapsedMs = endTime - sessionData.runningStartedAt;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        const timeText = formatElapsedTime(elapsedSeconds);

        timingContainer.innerHTML = `
            <svg class="modal-timing-icon" viewBox="0 0 13 13" fill="none">
                ${SVG_ICONS.TIME}
            </svg>
            <span id="modal-timing-text">${timeText}</span>
        `;
    }

    updateModalScreenshot(screenshotData) {
        const modalScreenshotContainer = document.getElementById(
            DOM_SELECTORS.MODAL_SCREENSHOT_CONTAINER
        );
        if (!modalScreenshotContainer) return;

        if (screenshotData && screenshotData.trim()) {
            modalScreenshotContainer.innerHTML = "";
            const img = document.createElement("img");
            img.className = "screenshot-img";
            img.src = screenshotData.startsWith("data:image/")
                ? screenshotData
                : `data:image/png;base64,${screenshotData}`;
            img.onerror = () => {
                modalScreenshotContainer.innerHTML =
                    '<div class="screenshot-placeholder">Failed to load screenshot</div>';
            };
            modalScreenshotContainer.appendChild(img);
        } else {
            // If no screenshot data, get session data and use fancy placeholder
            const sessionUid = this.stateManager.currentModalSessionUid;
            const sessionData = this.stateManager.getSession(sessionUid);
            modalScreenshotContainer.innerHTML = this.uiRenderer.getImagePlaceholder(
                sessionData?.status
            );
        }
    }

    refreshSessions() {
        console.log("🔄 In event-driven mode - no manual refresh needed");
        return this.getSessionStatus();
    }

    getSessionStatus() {
        const sessions = {};
        for (const [sessionUid, sessionData] of this.stateManager.sessionData) {
            sessions[sessionUid] = sessionData;
        }
        return sessions;
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            console.log("🔍 Entered fullscreen mode");
        } else {
            document.exitFullscreen();
            console.log("🔍 Exited fullscreen mode");
        }
    }

    destroy() {
        this.timerManager.destroy();
        this.eventHandler.destroy();
        this.stateManager.destroy();
        console.log("🧹 Dashboard cleaned up");
    }

    setupExternalLink() {
        const externalLinkBtn = document.getElementById("external-dashboard-link");
        if (!externalLinkBtn) {
            console.log("External link button not found");
            return;
        }

        // Use the API URL passed from the backend, or fallback to default
        this.apiBaseUrl = this.apiUrl || "http://127.0.0.1:8000";

        // Remove any existing event listeners by cloning the element
        const newBtn = externalLinkBtn.cloneNode(true);
        externalLinkBtn.parentNode.replaceChild(newBtn, externalLinkBtn);

        if (this.appUid) {
            newBtn.style.opacity = "1";
            newBtn.style.pointerEvents = "auto";
            newBtn.addEventListener("click", e => {
                e.preventDefault();
                e.stopPropagation();
                const externalUrl = `${this.apiBaseUrl}/app/${this.appUid}`;
                console.log("Opening external app dashboard:", externalUrl);

                // Dispatch custom event to request opening URL in system browser
                console.log("EXTERNAL_URL_REQUEST:", externalUrl);
                window.dispatchEvent(
                    new CustomEvent("openExternalUrl", {
                        detail: { url: externalUrl },
                    })
                );
            });
            console.log(`External link setup complete for app: ${this.appUid}`);
        } else {
            newBtn.style.opacity = "0.5";
            newBtn.style.pointerEvents = "none";
            console.log("No appUid available, external link disabled");
        }
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    if (window.qaDashboard) {
        console.log("🔄 Dashboard already exists, skipping creation");
        return;
    }

    window.qaDashboard = new QADashboard();

    // Expose useful functions to console
    window.refreshAll = () => window.qaDashboard.refreshSessions();
    window.getStatus = () => window.qaDashboard.getSessionStatus();
    window.destroyDashboard = () => {
        window.qaDashboard.destroy();
        window.qaDashboard = null;
    };

    console.log("🎛️ Dashboard controls available:");
    console.log("  - refreshAll() - Manual refresh all sessions");
    console.log("  - getStatus() - Get session status");
    console.log("  - destroyDashboard() - Clean up dashboard");
    console.log("  - Updates via custom events (real-time)");
    console.log("  - Click any session card to open in full-screen modal");
    console.log("  - ESC key or click outside modal to close");
    console.log("  - Ctrl/Cmd+R - Manual refresh");
    console.log("  - Ctrl/Cmd+F - Toggle fullscreen");
});
