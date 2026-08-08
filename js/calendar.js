// ============================================================
//  JALALI CALENDAR
// ============================================================
const PersianDate = {
    toJalali(gy, gm, gd) {
        const g_days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        let gy2 = (gm > 2) ? gy + 1 : gy;
        let days = 355666 + 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400);
        for (let i = 0; i < gm - 1; ++i) days += g_days[i];
        days += gd - 1;
        let jy = -1, jm = -1, jd = -1;
        for (let i = 0; i < 12; ++i) {
            let jm_days = (i < 6) ? 31 : (i < 11) ? 30 : 29;
            if (days < jm_days) { jy = 0; jm = i + 1; jd = days + 1; break; }
            days -= jm_days;
        }
        if (jy === -1) { jy = 0; jm = 12; jd = days + 1; }
        const leap = (jy % 4 === 0 && jy % 100 !== 0) || (jy % 400 === 0);
        if (jm === 12 && jd > 29 && !leap) jd = 29;
        return { year: jy, month: jm, day: jd };
    },

    now() {
        const now = new Date();
        return this.toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    },

    format(date, format = 'YYYY/MM/DD') {
        const y = String(date.year).padStart(4, '0');
        const m = String(date.month).padStart(2, '0');
        const d = String(date.day).padStart(2, '0');
        return format.replace('YYYY', y).replace('MM', m).replace('DD', d);
    },

    parse(str) {
        const parts = str.split('/');
        if (parts.length === 3) {
            return { year: parseInt(parts[0]), month: parseInt(parts[1]), day: parseInt(parts[2]) };
        }
        return null;
    },

    compare(d1, d2) {
        if (d1.year !== d2.year) return d1.year - d2.year;
        if (d1.month !== d2.month) return d1.month - d2.month;
        return d1.day - d2.day;
    }
};
