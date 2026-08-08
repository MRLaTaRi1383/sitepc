// ============================================================
//  JALALI CALENDAR (Simple Implementation)
// ============================================================

const PersianDate = {
    // Convert Gregorian to Jalali
    toJalali(gy, gm, gd) {
        const g_days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        const j_days_in_month = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

        let gy2 = (gm > 2) ? (gy + 1) : gy;
        let days = 355666 + 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400);
        for (let i = 0; i < gm - 1; ++i) {
            days += g_days_in_month[i];
        }
        days += gd - 1;

        let jy = -1;
        let jm = -1;
        let jd = -1;
        let jm_days = 0;

        for (let i = 0; i < 12; ++i) {
            jm_days = (i < 6) ? 31 : (i < 11) ? 30 : 29;
            if (days < jm_days) {
                jy = 0;
                jm = i + 1;
                jd = days + 1;
                break;
            }
            days -= jm_days;
        }

        if (jy === -1) {
            jy = 0;
            jm = 12;
            jd = days + 1;
        }

        // Adjust for leap years
        const leap = (jy % 4 === 0 && jy % 100 !== 0) || (jy % 400 === 0);
        if (jm === 12 && jd > 29 && !leap) {
            jd = 29;
        }

        return { year: jy, month: jm, day: jd };
    },

    // Get current Jalali date
    now() {
        const now = new Date();
        return this.toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    },

    // Format Jalali date
    format(date, format = 'YYYY/MM/DD') {
        const y = String(date.year).padStart(4, '0');
        const m = String(date.month).padStart(2, '0');
        const d = String(date.day).padStart(2, '0');
        return format.replace('YYYY', y).replace('MM', m).replace('DD', d);
    },

    // Parse Jalali date string (YYYY/MM/DD)
    parse(str) {
        const parts = str.split('/');
        if (parts.length === 3) {
            return { year: parseInt(parts[0]), month: parseInt(parts[1]), day: parseInt(parts[2]) };
        }
        return null;
    },

    // Compare two Jalali dates
    compare(date1, date2) {
        if (date1.year !== date2.year) return date1.year - date2.year;
        if (date1.month !== date2.month) return date1.month - date2.month;
        return date1.day - date2.day;
    }
};

// ============================================================
//  SHOW CURRENT DATE IN HEADER
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const now = PersianDate.now();
    const dateStr = PersianDate.format(now);
    const dateEl = document.createElement('span');
    dateEl.style.cssText = 'font-size:0.75rem; color:var(--muted); margin-right:12px;';
    dateEl.textContent = `📅 ${dateStr}`;
    const header = document.querySelector('.header-inner');
    if (header) {
        const brand = header.querySelector('.brand');
        if (brand) {
            brand.appendChild(dateEl);
        }
    }
});