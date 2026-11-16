const firebaseConfig = {
    apiKey: "AIzaSyDGl7YAsigHECh3C_C6o98NEgTa-WsRYGM",
    authDomain: "posm-sale.firebaseapp.com",
    databaseURL: "https://posm-sale-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "posm-sale",
    storageBucket: "posm-sale.firebasestorage.app",
    messagingSenderId: "894727038124",
    appId: "1:894727038124:web:7504cfac4b3c7663d46b09"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const saleIIst = ['101','102','103','104','105','106','107','108','109','110','111','112','113','114','115','116','117','118','119','120','122','128','129','130','131','132','140','141','142','143','144','145','146','147'];
const saleIst = ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','22','40','41','42','43','44','45','46','47','48','49','52','57B'];
const saleJazz = ['01','02','03','04','06','07','08'];
const saleInne = ['Koncertowa','Kameralna','Lustrzana','Kryształowa'];
const wszystkieSale = saleIIst.concat(saleIst, saleJazz, saleInne);
const saleFortepian = ['Koncertowa', 'Lustrzana', 'Kameralna', 'Kryształowa', '16', '18', '113', '114', '116', '117', '118', '128', '129', '130', '131', '120', '01', '02', '20', '57B']; 

const UKLAD_TABLICY = [
    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
    ['101', '102', '103', '104', '105', '106', '107', '108', '109', '110', '111', '112', '113', '114', '115', '116', '117', '118', '119', '120'],
    ['122', '128', '129', '130', '131', '132', '140', '141', '142', '143', '144', '145', '146', '147', null, 'Koncertowa', 'Kameralna', 'Lustrzana', 'Kryształowa', null],
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'],
    ['22', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '52', '57B', null, null, null, null, null, null, null],
    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null, '08', '07', '06', '04', '03', '02', '01']
];

let aktualneStatusy = {}, pelneDaneSal = {};
let aktywnyFiltr = 'wszystkie', obecnaWizualizacja = 'klasyczna';
let zalogowanyUid = null, zalogowanyUczen = null, wybranaSalaModal = null;
let ulubioneSale = [], wszystkieAnkiety = {}, wszystkiePropozycje = {}, wszystkieZgody = {};
let pelnaBazaUczniow = {}; 
let otwarteKomentarze = new Set(); 
let domyslnyConfirmCallback = null;

const tabOrderUcznia = ['start', 'salki', 'glosowania', 'propozycje', 'panel-samorzadu'];
let aktywnaZakladkaId = 'start';
let isTabAnimating = false;

window.pokazAlert = function(tytul, tresc) {
    document.getElementById('custom-alert-title').innerText = tytul;
    document.getElementById('custom-alert-text').innerText = tresc;
    pokazEkran('custom-alert-modal');
    setTimeout(() => {
        document.getElementById('custom-alert-box').classList.remove('scale-95');
        document.getElementById('custom-alert-box').classList.add('scale-100');
    }, 10);
};

window.zamknijAlert = function() {
    document.getElementById('custom-alert-box').classList.remove('scale-100');
    document.getElementById('custom-alert-box').classList.add('scale-95');
    setTimeout(() => { ukryjEkran('custom-alert-modal'); }, 200);
};

window.pokazConfirm = function(tytul, tresc, potwierdzCallback) {
    document.getElementById('custom-confirm-title').innerText = tytul;
    document.getElementById('custom-confirm-text').innerText = tresc;
    domyslnyConfirmCallback = potwierdzCallback;
    document.getElementById('custom-confirm-btn').onclick = () => {
        if(domyslnyConfirmCallback) domyslnyConfirmCallback();
        zamknijConfirm();
    };
    pokazEkran('custom-confirm-modal');
    setTimeout(() => {
        document.getElementById('custom-confirm-box').classList.remove('scale-95');
        document.getElementById('custom-confirm-box').classList.add('scale-100');
    }, 10);
};

window.zamknijConfirm = function() {
    document.getElementById('custom-confirm-box').classList.remove('scale-100');
    document.getElementById('custom-confirm-box').classList.add('scale-95');
    setTimeout(() => {
        ukryjEkran('custom-confirm-modal');
        domyslnyConfirmCallback = null;
    }, 200);
};

async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function ukryjEkran(id) {
    const el = document.getElementById(id);
    if (el) {
        el.style.setProperty('display', 'none', 'important');
        el.classList.add('hidden');
    }
}

function pokazEkran(id, type = 'flex') {
    const el = document.getElementById(id);
    if (el) {
        el.classList.remove('hidden');
        el.style.setProperty('display', type, 'important');
    }
}

function usunPolskieZnaki(str) {
    const mapa = {'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z','Ą':'a','Ć':'c','Ę':'e','Ł':'l','Ń':'n','Ó':'o','Ś':'s','Ź':'z','Ż':'z'};
    return str ? String(str).replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, c => mapa[c] || c).toLowerCase().trim() : "";
}

function wygenerujLoginZImienia(imieNazwisko) {
    if (!imieNazwisko) return "uczen";
    const czesci = usunPolskieZnaki(imieNazwisko).replace(/-/g, ' ').split(/\s+/).filter(Boolean);
    return czesci.length > 1 ? czesci[0].charAt(0) + '.' + czesci.slice(1).join('.') : (czesci[0] || "uczen");
}

function ucieczkaHtml(tekst) {
    return tekst ? String(tekst).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;") : "";
}

function terazDataString() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

function sformatujImieINazwiskoKropka(imieNazwisko) {
    const czesci = (imieNazwisko || 'Uczeń').trim().split(/\s+/).filter(Boolean);
    const imie = czesci[0] || 'Uczeń';
    const nazwisko = czesci.length > 1 ? czesci[czesci.length - 1] : '';
    return nazwisko ? `${imie} ${nazwisko.charAt(0).toUpperCase()}.` : imie;
}

function czyKontoToPracownik(u) {
    if (!u) return false;
    const rola = String(u.rola || '').toLowerCase().trim();
    const klasa = String(u.klasa || '').toLowerCase().trim();
    if (rola === 'uczen' || rola === 'samorzad' || klasa.includes('a') || klasa.includes('b')) return false;
    return ['nauczyciel', 'pracownik', 'administracja', 'obsluga'].includes(rola) ||
           klasa.includes('nauczyciel') || klasa.includes('pracownik') || klasa.includes('obsług') || klasa.includes('obslug');
}

function zastosujOgraniczeniaKonta() {
    const isPracownik = czyKontoToPracownik(zalogowanyUczen);
    const ukryteZakladki = ['tab-uczen-glosowania', 'tab-uczen-propozycje', 'tab-uczen-panel-samorzadu'];
    
    ukryteZakladki.forEach(id => {
        const btn = document.getElementById(id);
        if (!btn) return;
        if (isPracownik) {
            btn.classList.add('hidden');
            btn.style.setProperty('display', 'none', 'important');
        } else if (id !== 'tab-uczen-panel-samorzadu') {
            btn.classList.remove('hidden');
            btn.style.removeProperty('display');
        }
    });
}

window.przelaczZakladkeUcznia = function(nazwa) {
    if (czyKontoToPracownik(zalogowanyUczen) && nazwa !== 'start' && nazwa !== 'salki') return;
    if (nazwa === aktywnaZakladkaId || isTabAnimating) return;

    const oldIdx = tabOrderUcznia.indexOf(aktywnaZakladkaId);
    const newIdx = tabOrderUcznia.indexOf(nazwa);
    const direction = newIdx > oldIdx ? 'right' : 'left'; 

    isTabAnimating = true;
    const oldView = document.getElementById('widok-' + aktywnaZakladkaId);
    const newView = document.getElementById('widok-' + nazwa);

    tabOrderUcznia.forEach(id => {
        const btn = document.getElementById('tab-uczen-' + id);
        if(btn) {
            if (id === nazwa) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    });

    if (oldView) {
        oldView.classList.remove('anim-slide-in-right', 'anim-slide-in-left', 'animate-fade-in');
        oldView.classList.add(direction === 'right' ? 'anim-slide-out-left' : 'anim-slide-out-right');
    }

    setTimeout(() => {
        if (oldView) {
            ukryjEkran('widok-' + aktywnaZakladkaId);
            oldView.classList.remove('anim-slide-out-left', 'anim-slide-out-right');
        }
        if (newView) {
            pokazEkran('widok-' + nazwa, 'flex');
            newView.classList.remove('anim-slide-out-left', 'anim-slide-out-right', 'animate-fade-in');
            newView.classList.add(direction === 'right' ? 'anim-slide-in-right' : 'anim-slide-in-left');
        }
        aktywnaZakladkaId = nazwa;
        setTimeout(() => { isTabAnimating = false; }, 300);
        window.scrollTo({top: 0, behavior: 'smooth'});
    }, 280); 
};

function sprawdzUprawnieniaSamorzadu() {
    if (czyKontoToPracownik(zalogowanyUczen)) return;
    if (zalogowanyUczen && zalogowanyUczen.rola === 'samorzad') {
        const btn = document.getElementById('tab-uczen-panel-samorzadu');
        if (btn) {
            btn.classList.remove('hidden');
            btn.style.setProperty('display', 'inline-flex', 'important'); 
        }
    }
}

function uruchomAnimacjePowitania(daneUcznia, callback) {
    const ep = document.getElementById('ekran-powitania');
    const imie = daneUcznia.imie_nazwisko ? daneUcznia.imie_nazwisko.split(' ')[0] : 'Uczniu';
    ep.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full w-full relative">
            <h1 id="tekst-powitania" class="text-4xl sm:text-5xl font-black text-white text-glow opacity-0 transition-all duration-1000 transform translate-y-4 tracking-tight absolute">Cześć, ${ucieczkaHtml(imie)}</h1>
            <div id="loader-kontener" class="w-48 h-[2px] bg-white/10 rounded-full overflow-hidden opacity-0 absolute transition-opacity duration-700">
                <div class="h-full bg-white w-0" id="powitanie-bar" style="transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);"></div>
            </div>
        </div>
    `;
    pokazEkran('ekran-powitania');
    setTimeout(() => { document.getElementById('tekst-powitania')?.classList.remove('opacity-0', 'translate-y-4'); }, 100);
    setTimeout(() => { document.getElementById('tekst-powitania')?.classList.add('opacity-0', '-translate-y-4'); }, 1800);
    setTimeout(() => {
        document.getElementById('loader-kontener')?.classList.remove('opacity-0');
        setTimeout(() => { const b = document.getElementById('powitanie-bar'); if(b) b.style.width = '100%'; }, 100);
    }, 2400);
    setTimeout(() => {
        ep.classList.add('opacity-0');
        setTimeout(() => { ukryjEkran('ekran-powitania'); ep.classList.remove('opacity-0'); ep.innerHTML = ''; callback(); }, 600);
    }, 4000);
}

window.zalogujUcznia = async function() {
    const loginWpisany = usunPolskieZnaki(document.getElementById('login-input').value.trim()).replace(/[-\s]+/g, '.').replace(/\.+/g, '.');
    const hasloWpisane = document.getElementById('haslo-input').value.trim();
    if (!loginWpisany || !hasloWpisane) { pokazAlert("Uwaga", "Wpisz login oraz hasło."); return; }

    db.ref('uczniowie').once('value', async snap => {
        const uczniowie = snap.val() || {};
        let znUid = null, znDane = null;
        for (const [uid, u] of Object.entries(uczniowie)) {
            if (!u || !u.imie_nazwisko) continue;
            const logKrotki = wygenerujLoginZImienia(u.imie_nazwisko);
            const logBazy = u.login ? usunPolskieZnaki(u.login).replace(/[-\s]+/g, '.').replace(/\.+/g, '.') : logKrotki;
            if (loginWpisany === logBazy || loginWpisany === logKrotki) { znUid = uid; znDane = u; break; }
        }
        if (!znUid) { pokazAlert("Błąd logowania", "Nie znaleziono konta."); return; }
        
        const hashedWpisane = await sha256(hasloWpisane);
        if (znDane.zmieniono_haslo === true) {
            if (String(znDane.haslo) !== hashedWpisane) { pokazAlert("Błąd logowania", "Błędne hasło."); return; }
        } else {
            if (String(znDane.haslo || 'posm123') !== hasloWpisane) { pokazAlert("Błąd logowania", "Błędne hasło (startowe)."); return; }
        }
        
        zalogowanyUid = znUid; zalogowanyUczen = znDane;
        ulubioneSale = znDane.ulubione ? Object.values(znDane.ulubione).filter(Boolean) : [];

        if (znDane.zmieniono_haslo !== true) {
            ukryjEkran('ekran-logowania'); pokazEkran('ekran-zmiany-hasla');
        } else {
            ukryjEkran('ekran-logowania');
            localStorage.setItem('posm_uczen_uid', zalogowanyUid); 
            uruchomAnimacjePowitania(znDane, () => { uruchomWidokTablicy(); sprawdzUprawnieniaSamorzadu(); });
        }
    });
};

window.zapiszNoweHaslo = async function() {
    const h1 = document.getElementById('nowe-haslo-1').value.trim(), h2 = document.getElementById('nowe-haslo-2').value.trim();
    if (h1.length < 4) { pokazAlert("Uwaga", "Minimum 4 znaki."); return; }
    if (h1 === String(zalogowanyUczen.haslo || '') || h1.toLowerCase() === 'posm123') { pokazAlert("Uwaga", "Hasło musi różnić się od startowego."); return; }
    if (h1 !== h2) { pokazAlert("Uwaga", "Hasła nie są identyczne."); return; }

    const hashedHaslo = await sha256(h1);
    db.ref('uczniowie/' + zalogowanyUid).update({ login: wygenerujLoginZImienia(zalogowanyUczen.imie_nazwisko), haslo: hashedHaslo, zmieniono_haslo: true }).then(() => {
        zalogowanyUczen.haslo = hashedHaslo; zalogowanyUczen.zmieniono_haslo = true;
        localStorage.setItem('posm_uczen_uid', zalogowanyUid);
        ukryjEkran('ekran-zmiany-hasla');
        uruchomAnimacjePowitania(zalogowanyUczen, () => { uruchomWidokTablicy(); sprawdzUprawnieniaSamorzadu(); });
    }).catch(err => pokazAlert("Błąd bazy", err.message));
};

window.zalogowanyWyloguj = function() { localStorage.removeItem('posm_uczen_uid'); location.reload(); };
window.wylogujUcznia = window.zalogowanyWyloguj;

window.addEventListener('DOMContentLoaded', () => {
    const zUid = localStorage.getItem('posm_uczen_uid');
    if (zUid) {
        ukryjEkran('ekran-logowania');
        db.ref('uczniowie/' + zUid).once('value', snap => {
            const dane = snap.val();
            if (dane && dane.zmieniono_haslo === true) {
                zalogowanyUid = zUid; zalogowanyUczen = dane; 
                ulubioneSale = dane.ulubione ? Object.values(dane.ulubione).filter(Boolean) : []; 
                uruchomAnimacjePowitania(dane, () => { uruchomWidokTablicy(); sprawdzUprawnieniaSamorzadu(); });
            } else { pokazEkran('ekran-logowania'); }
        });
    } else { pokazEkran('ekran-logowania'); }
});

function odswiezDaneProfiluUI() {
    try {
        const i1 = zalogowanyUczen.instrument || '-';
        const i2 = (zalogowanyUczen.instrument2 || zalogowanyUczen.instrument_2 || zalogowanyUczen.drugi_instrument || '').trim();
        const krotkaNazwa = sformatujImieINazwiskoKropka(zalogowanyUczen.imie_nazwisko);
        
        document.getElementById('nav-uczen-info').innerText = krotkaNazwa + ' (' + (zalogowanyUczen.klasa || '-') + ')';
        document.getElementById('start-powitanie').innerText = (zalogowanyUczen.imie_nazwisko || 'Uczeń').split(' ')[0];
        document.getElementById('start-klasa').innerText = (zalogowanyUczen.rola === 'nauczyciel' || zalogowanyUczen.rola === 'pracownik') ? 'Pracownik szkoły' : 'Klasa ' + (zalogowanyUczen.klasa || '-');
        
        const startAvatarBox = document.getElementById('start-avatar-box');
        if (startAvatarBox) {
            const inicjaly = (zalogowanyUczen.imie_nazwisko || 'U').trim().split(/\s+/);
            startAvatarBox.innerHTML = `<span class="text-xl sm:text-2xl font-black text-white select-none">${ucieczkaHtml((inicjaly[0].charAt(0) + (inicjaly[1] ? inicjaly[1].charAt(0) : '')).toUpperCase())}</span>`;
        }

        const i1L = i1.toLowerCase();
        const czyPrzedmiot = i1L.includes('dyrygentur') || i1L.includes('lutnictw') || i1L.includes('kompozycj');
        const lbl = document.getElementById('label-instr-1');
        if (lbl) lbl.innerText = czyPrzedmiot ? 'Przedmiot główny' : 'Główny instrument';

        document.getElementById('start-instr-1').innerText = i1;
        document.getElementById('start-instr-2').innerText = i2 ? i2 : 'Brak';
    } catch (e) {}
}

function uruchomWidokTablicy() {
    window.scrollTo(0, 0); 
    try {
        zastosujOgraniczeniaKonta();
        odswiezDaneProfiluUI(); 
        generujTabliceKlasyczna(); 
        renderujTabliceFizyczna(); 
        renderujUlubione();
        nasluchujZmianSal(); 
        nasluchujAnkietIPropozycji();
        renderujZgodyUcznia();

        db.ref('uczniowie').on('value', snap => {
            pelnaBazaUczniow = snap.val() || {};
            if (zalogowanyUid && pelnaBazaUczniow[zalogowanyUid]) {
                zalogowanyUczen = pelnaBazaUczniow[zalogowanyUid];
                try { odswiezDaneProfiluUI(); } catch(e) {}
            }
            if (zalogowanyUczen && zalogowanyUczen.rola === 'samorzad') {
                if (typeof renderujAnkietyZarzadzanie === 'function') renderujAnkietyZarzadzanie();
                if (typeof renderujPropozycjeZarzadzanie === 'function') renderujPropozycjeZarzadzanie();
            }
            try {
                generujTabliceKlasyczna();
                if (obecnaWizualizacja === 'fizyczna') renderujTabliceFizyczna();
                ustawFiltr(aktywnyFiltr);
            } catch(e) {}
        });
    } catch (globalError) {}

    aktywnaZakladkaId = 'start';
    pokazEkran('ekran-glowny', 'flex');
}

function renderujZgodyUcznia() {
    const kon = document.getElementById('start-lista-zgod'); 
    if (!kon) return;
    if (zalogowanyUczen && (zalogowanyUczen.rola === 'nauczyciel' || zalogowanyUczen.rola === 'pracownik' || zalogowanyUczen.rola === 'administracja' || zalogowanyUczen.rola === 'obsluga')) {
        kon.innerHTML = '<div class="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col gap-1"><span class="font-bold text-emerald-300">Nielimitowany dostęp</span><span class="text-xs text-zinc-300">Jako pracownik szkoły masz stały, nielimitowany dostęp do wszystkich sal.</span></div>';
        return;
    }
    const zgody = Object.values(wszystkieZgody).filter(z => z && z.uid === zalogowanyUid);
    if (zgody.length === 0) { kon.innerHTML = '<div class="text-xs text-zinc-500 py-2">Brak dodatkowych zgód weekendowych.</div>'; return; }
    kon.innerHTML = zgody.map(z => {
        const ter = z.typ === 'miesiac' 
            ? `Cały miesiąc ${ucieczkaHtml(z.miesiac)} (${z.dni_miesiaca === 'sobota' ? 'Soboty' : (z.dni_miesiaca === 'niedziela' ? 'Niedziele' : 'Soboty i Niedziele')})`
            : ucieczkaHtml([z.data_sobota ? 'Sobota '+z.data_sobota : null, z.data_niedziela ? 'Niedziela '+z.data_niedziela : null].filter(Boolean).join(' oraz '));
        return `<div class="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
                <div class="text-xs font-bold text-emerald-300">${ter}</div>
                <div class="text-[11px] text-zinc-300 mt-0.5">Godziny: Sob <b>${ucieczkaHtml(z.sob_od)}–${ucieczkaHtml(z.sob_do)}</b> • Ndz <b>${ucieczkaHtml(z.ndz_od)}–${ucieczkaHtml(z.ndz_do)}</b></div>
            </div>
            <span class="emblem emblem-emerald shrink-0">Aktywna</span>
        </div>`;
    }).join('');
}

function renderujWidokStart() {
    const elWolne = document.getElementById('start-wolne-liczba');
    if (elWolne) {
        let wCount = 0;
        wszystkieSale.forEach(nr => { if (!aktualneStatusy[nr] || aktualneStatusy[nr] === 'WOLNA') wCount++; });
        elWolne.innerText = wCount;
    }
}

function nasluchujAnkietIPropozycji() {
    db.ref('samorzad_ankiety').on('value', snap => { 
        wszystkieAnkiety = snap.val() || {}; 
        renderujAnkietyUcznia(); 
        if (zalogowanyUczen && zalogowanyUczen.rola === 'samorzad' && typeof renderujAnkietyZarzadzanie === 'function') renderujAnkietyZarzadzanie();
    });
    db.ref('samorzad_propozycje').on('value', snap => { 
        wszystkiePropozycje = snap.val() || {}; 
        renderujPropozycjeUcznia(); 
        if (zalogowanyUczen && zalogowanyUczen.rola === 'samorzad' && typeof renderujPropozycjeZarzadzanie === 'function') renderujPropozycjeZarzadzanie();
    });
    db.ref('zgody_weekendowe').on('value', snap => { 
        wszystkieZgody = snap.val() || {}; 
        renderujZgodyUcznia(); 
    });
}

function renderujAnkietyUcznia() {
    const kon = document.getElementById('lista-ankiet-uczen');
    const b = document.getElementById('badge-ankiety-count'); 
    if (!kon) return;
    
    const lista = Object.entries(wszystkieAnkiety).map(e => Object.assign({ id: e[0] }, e[1])).sort((a, b) => (b.czas || '').localeCompare(a.czas || ''));
    const aktNie = lista.filter(a => a.aktywna !== false && (!a.glosy || a.glosy[zalogowanyUid] === undefined)).length;
    
    if (aktNie > 0 && b) { b.innerText = aktNie; b.classList.remove('hidden'); } else if(b) b.classList.add('hidden');
    if (lista.length === 0) { kon.innerHTML = '<div class="glass-panel p-8 text-center text-zinc-400 text-xs font-bold uppercase tracking-wider">Brak aktywnych głosowań</div>'; return; }

    kon.innerHTML = lista.map(ank => {
        const opc = Array.isArray(ank.opcje) ? ank.opcje : [], glosy = ank.glosy || {}, mG = glosy[zalogowanyUid], czyAkt = ank.aktywna !== false;
        const licz = opc.map(() => 0); let sum = 0;
        Object.values(glosy).forEach(idx => { if (licz[idx] !== undefined) { licz[idx]++; sum++; } });
        
        let opHtml = opc.map((t, idx) => {
            const ile = licz[idx] || 0, p = sum > 0 ? Math.round((ile / sum) * 100) : 0, czW = (mG === idx);
            if (mG !== undefined || !czyAkt) {
                return `<div class="relative overflow-hidden rounded-xl border ${czW ? 'border-indigo-500 bg-indigo-500/15' : 'border-white/10 bg-zinc-900/60'} p-3.5 mb-2.5"><div class="absolute inset-y-0 left-0 bg-indigo-500/25 transition-all duration-500" style="width: ${p}%;"></div><div class="relative flex justify-between items-center text-xs sm:text-sm gap-2"><span class="font-semibold text-white flex items-center gap-2 flex-wrap">${ucieczkaHtml(t)}${czW ? '<span class="emblem emblem-indigo">Twój głos</span>' : ''}</span><span class="font-bold text-indigo-300 shrink-0">${p}% (${ile})</span></div></div>`;
            }
            return `<button onclick="oddajGlosWAnkiecie('${ank.id}', ${idx})" class="w-full text-left rounded-xl border border-white/10 hover:border-indigo-500 bg-zinc-900/70 hover:bg-indigo-500/10 p-3.5 mb-2.5 transition-all flex justify-between items-center text-xs sm:text-sm font-semibold text-white"><span>${ucieczkaHtml(t)}</span><span class="emblem emblem-indigo shrink-0">Zagłosuj</span></button>`;
        }).join('');
        
        return `<div class="glass-panel p-5 sm:p-7"><div class="flex justify-between items-start gap-3 mb-2"><h3 class="text-base sm:text-lg font-bold text-white">${ucieczkaHtml(ank.tytul)}</h3>${czyAkt ? '<span class="emblem emblem-emerald"><span class="status-dot dot-emerald"></span>Aktywne</span>' : '<span class="emblem emblem-rose">Zakończone</span>'}</div>${ank.opis ? `<p class="text-xs sm:text-sm text-zinc-300 mb-4">${ucieczkaHtml(ank.opis)}</p>` : ''}<div class="mt-3">${opHtml}</div><div class="flex justify-between items-center text-[11px] text-zinc-400 mt-4 pt-3 border-t border-white/10"><span>Oddanych głosów: <b class="text-white">${sum}</b></span><span>${ank.czas || '-'}</span></div></div>`;
    }).join('');
};

window.oddajGlosWAnkiecie = (id, idx) => {
    if (!zalogowanyUid) return;
    const a = wszystkieAnkiety[id]; 
    if (!a || a.aktywna === false || (a.glosy && a.glosy[zalogowanyUid] !== undefined)) return;
    db.ref(`samorzad_ankiety/${id}/glosy/${zalogowanyUid}`).transaction(curr => curr === null ? idx : undefined);
};

window.otworzModalNowejPropozycji = () => { pokazEkran('modal-nowa-propozycja'); };
window.zamknijModalNowejPropozycji = () => { ukryjEkran('modal-nowa-propozycja'); };

window.dodajPropozycje = () => {
    const t = document.getElementById('prop-tytul').value.trim(), o = document.getElementById('prop-opis').value.trim(), a = document.getElementById('prop-anonim').checked;
    if (t.length < 4 || o.length < 6) { pokazAlert("Uwaga", "Wprowadź sensowny tytuł i treść."); return; }
    db.ref('samorzad_propozycje').push({ 
        tytul: t, opis: o, anonim: a, 
        autor_prawdziwy: `${zalogowanyUczen.imie_nazwisko} (${zalogowanyUczen.klasa || '-'})`, 
        autor_uid: zalogowanyUid, czas: terazDataString(), status: 'Nowa', odpowiedz_admina: '' 
    }).then(() => {
        document.getElementById('prop-tytul').value = ''; 
        document.getElementById('prop-opis').value = ''; 
        document.getElementById('prop-anonim').checked = false; 
        zamknijModalNowejPropozycji();
    });
};

window.glosujNaPropozycje = (id, typ) => {
    if (!zalogowanyUid) return;
    const p = wszystkiePropozycje[id]; 
    if (!p || (p.glosy && p.glosy[zalogowanyUid] !== undefined)) return;
    db.ref(`samorzad_propozycje/${id}/glosy/${zalogowanyUid}`).transaction(c => c === null ? typ : undefined);
};

window.toggleKomentarze = function(id) {
    if (otwarteKomentarze.has(id)) otwarteKomentarze.delete(id);
    else otwarteKomentarze.add(id);
    renderujPropozycjeUcznia();
};

window.wyslijKomentarz = function(id) {
    const el = document.getElementById('komentarz-input-' + id);
    const txt = el.value.trim();
    if (!txt) return;
    const kom = {
        autor: zalogowanyUczen.imie_nazwisko + ' (' + (zalogowanyUczen.klasa || '-') + ')',
        uid: zalogowanyUid,
        tresc: txt,
        czas: terazDataString()
    };
    db.ref(`samorzad_propozycje/${id}/komentarze`).push(kom).then(() => { el.value = ''; });
};

function renderujPropozycjeUcznia() {
    const kon = document.getElementById('lista-propozycji-uczen'); 
    if (!kon) return;
    const lista = Object.entries(wszystkiePropozycje).map(e => Object.assign({ id: e[0] }, e[1])).sort((a, b) => (b.czas || '').localeCompare(a.czas || ''));
    if (lista.length === 0) { kon.innerHTML = '<div class="glass-panel p-8 text-center text-zinc-400 text-xs font-bold uppercase tracking-wider">Brak propozycji</div>'; return; }

    kon.innerHTML = lista.map(p => {
        const g = p.glosy || {}; let za = 0, pr = 0;
        Object.values(g).forEach(v => { if (v === 'za') za++; else if (v === 'przeciw') pr++; });
        const mG = g[zalogowanyUid], jG = mG !== undefined, st = p.status || 'Nowa';
        const em = st === 'Zaakceptowana' || st === 'W realizacji' ? 'emblem-emerald' : (st === 'Odrzucona' ? 'emblem-rose' : 'emblem-amber');
        const sZ = mG === 'za' ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-lg cursor-default' : (jG ? 'bg-zinc-900/50 text-zinc-500 cursor-not-allowed border-white/5' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25');
        const sP = mG === 'przeciw' ? 'bg-rose-500 text-white border-rose-400 shadow-lg cursor-default' : (jG ? 'bg-zinc-900/50 text-zinc-500 cursor-not-allowed border-white/5' : 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25');
        const komentyObj = p.komentarze ? Object.values(p.komentarze) : [];
        const isKomentyOpen = otwarteKomentarze.has(p.id);

        return `
        <div class="glass-panel p-5 sm:p-7 flex flex-col gap-3">
            <div class="flex justify-between items-center pb-3 border-b border-white/10">
                <div class="flex items-center gap-2.5">
                    ${p.anonim 
                        ? '<span class="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold">A</span><span class="text-sm font-bold text-indigo-300">Anonim</span>' 
                        : `<span class="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300 font-bold">${p.autor_prawdziwy.charAt(0)}</span><span class="text-sm font-bold text-white">${ucieczkaHtml(p.autor_prawdziwy)}</span>`
                    }
                </div>
                <div class="text-right flex flex-col items-end">
                    <span class="emblem ${em} mb-1 block w-max">${ucieczkaHtml(st)}</span>
                    <span class="text-[10px] text-zinc-500">${p.czas || '-'}</span>
                </div>
            </div>
            <div>
                <h3 class="text-lg font-bold text-white mb-2">${ucieczkaHtml(p.tytul)}</h3>
                <p class="text-sm text-zinc-300 whitespace-pre-line leading-relaxed">${ucieczkaHtml(p.opis)}</p>
            </div>
            ${p.odpowiedz_admina ? `
            <div class="mt-2 p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 relative">
                <div class="absolute -top-2.5 left-4 px-2 bg-[#090d16] text-[10px] font-bold text-indigo-400 uppercase">Odpowiedź Samorządu</div>
                <p class="text-sm text-indigo-100 mt-1.5">${ucieczkaHtml(p.odpowiedz_admina)}</p>
            </div>` : ''}
            <div class="flex flex-wrap justify-between items-center gap-3 mt-2 pt-3 border-t border-white/10">
                <div class="flex items-center gap-2">
                    <button ${jG ? 'disabled' : `onclick="glosujNaPropozycje('${p.id}', 'za')"`} class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${sZ}"><span>👍</span> <span>${za}</span></button>
                    <button ${jG ? 'disabled' : `onclick="glosujNaPropozycje('${p.id}', 'przeciw')"`} class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${sP}"><span>👎</span> <span>${pr}</span></button>
                </div>
                <button onclick="toggleKomentarze('${p.id}')" class="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                    💬 Komentarze (${komentyObj.length})
                </button>
            </div>
            ${isKomentyOpen ? `
            <div class="mt-2 flex flex-col gap-2.5 pt-3 border-t border-white/5 animate-fade-in">
                <div class="max-h-[250px] overflow-y-auto no-scrollbar flex flex-col gap-2 pr-1">
                    ${komentyObj.length > 0 ? komentyObj.map(k => `
                        <div class="bg-zinc-900/50 p-3 rounded-xl border border-white/5 text-xs">
                            <div class="flex justify-between items-center mb-1">
                                <span class="font-bold text-emerald-300">${ucieczkaHtml(k.autor)}</span>
                                <span class="text-[9px] text-zinc-500">${k.czas}</span>
                            </div>
                            <p class="text-zinc-200 mt-1">${ucieczkaHtml(k.tresc)}</p>
                        </div>
                    `).join('') : '<p class="text-xs text-zinc-500 italic text-center py-2">Brak komentarzy. Bądź pierwszy!</p>'}
                </div>
                <div class="flex gap-2 mt-1">
                    <input type="text" id="komentarz-input-${p.id}" onkeypress="if(event.key === 'Enter') wyslijKomentarz('${p.id}')" placeholder="Napisz komentarz..." class="input-classic flex-grow rounded-xl px-3 py-2 text-xs">
                    <button onclick="wyslijKomentarz('${p.id}')" class="btn-classic-primary px-4 py-2 rounded-xl text-xs font-bold">Wyślij</button>
                </div>
            </div>` : ''}
        </div>`;
    }).join('');
}

function generujTabliceKlasyczna() {
    wypelnijGrupe('grid-IIst', saleIIst, 'IIst'); wypelnijGrupe('grid-Ist', saleIst, 'Ist');
    wypelnijGrupe('grid-jazz', saleJazz, 'jazz'); wypelnijGrupe('grid-inne', saleInne, 'inne');
}

function wypelnijGrupe(id, lista, kat) {
    const kon = document.getElementById(id); if (!kon) return;
    kon.innerHTML = lista.map(nr => `<div id="sala-${nr}" onclick="otworzModalSali('${nr}')" data-kategoria="${kat}" data-fortepian="${saleFortepian.includes(nr)}" class="${klasyKafelkaWgStatusu(aktualneStatusy[nr] || 'WOLNA')}">${wnetrzeKafelka(nr)}</div>`).join('');
}

function klasyKafelkaWgStatusu(status) {
    const base = "relative flex items-center justify-center p-2.5 h-14 sm:h-16 rounded-2xl font-bold text-sm sm:text-base cursor-pointer hover:scale-105 transition-all border shadow-sm ";
    if (status === 'ZAJĘTA') return base + "bg-rose-500/15 border-rose-500/35 text-rose-300 hover:bg-rose-500/25";
    if (status === 'ZABLOKOWANA') return base + "bg-purple-500/15 border-purple-500/35 text-purple-300 hover:bg-purple-500/25";
    return base + "bg-emerald-500/15 border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/25";
}

function wnetrzeKafelka(nr) {
    const dane = pelneDaneSal[nr];
    const kto = dane && typeof dane === 'object' ? dane.kto || '' : '';
    const isTeacher = kto.toLowerCase().includes('nauczyciel') || kto.toLowerCase().includes('pracownik');

    let sN = nr;
    if (nr === 'Koncertowa') sN = 'KON'; 
    else if (nr === 'Kameralna') sN = 'KAM'; 
    else if (nr === 'Lustrzana') sN = 'LUS'; 
    else if (nr === 'Kryształowa') sN = 'KRY';
    
    let wnetrze = '';
    if (ulubioneSale.includes(nr)) wnetrze += '<span class="absolute top-1.5 right-1.5 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400 shadow-sm"></span>';
    if (isTeacher) wnetrze += '<span class="absolute top-1.5 left-1.5 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white shadow-sm animate-pulse" title="Pracownik szkoły"></span>';
    wnetrze += `<span>${sN}</span>`;
    return wnetrze;
}

window.zmienWizualizacje = function(typ) {
    obecnaWizualizacja = typ;
    const bK = document.getElementById('btn-wiz-klasyczna'), bF = document.getElementById('btn-wiz-fizyczna');
    if (typ === 'fizyczna') {
        bK.className = "px-4 py-2 rounded-lg text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-all w-1/2 md:w-auto text-center";
        bF.className = "px-4 py-2 rounded-lg text-xs font-bold bg-white/10 text-white transition-all w-1/2 md:w-auto text-center";
        ukryjEkran('kontener-klasyczny'); pokazEkran('kontener-fizyczny');
        renderujTabliceFizyczna();
    } else {
        bF.className = "px-4 py-2 rounded-lg text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-all w-1/2 md:w-auto text-center";
        bK.className = "px-4 py-2 rounded-lg text-xs font-bold bg-white/10 text-white transition-all w-1/2 md:w-auto text-center";
        ukryjEkran('kontener-fizyczny'); pokazEkran('kontener-klasyczny');
    }
};

function renderujTabliceFizyczna() {
    const grid = document.getElementById('grid-fizyczny'); if (!grid) return;
    grid.innerHTML = '';
    UKLAD_TABLICY.forEach(rzad => {
        rzad.forEach(nr => {
            if (!nr) { grid.innerHTML += '<div class="h-10 sm:h-12 rounded-lg bg-transparent"></div>'; }
            else {
                const st = aktualneStatusy[nr] || 'WOLNA';
                let k = 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/25';
                if (st === 'ZAJĘTA') k = 'bg-rose-500/15 border-rose-500/35 text-rose-300 hover:bg-rose-500/25';
                else if (st === 'ZABLOKOWANA') k = 'bg-purple-500/15 border-purple-500/35 text-purple-300 hover:bg-purple-500/25';
                let sN = nr;
                if(nr === 'Koncertowa') sN = 'KON'; else if(nr === 'Kameralna') sN = 'KAM'; else if(nr === 'Lustrzana') sN = 'LUS'; else if(nr === 'Kryształowa') sN = 'KRY';
                
                let wnetrze = '';
                if (ulubioneSale.includes(nr)) wnetrze += '<span class="absolute top-1.5 right-1.5 w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-amber-400 shadow-sm"></span>';
                const kto = (pelneDaneSal[nr] && pelneDaneSal[nr].kto) ? pelneDaneSal[nr].kto.toLowerCase() : '';
                if (kto.includes('nauczyciel') || kto.includes('pracownik')) wnetrze += '<span class="absolute top-1.5 left-1.5 w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white shadow-sm animate-pulse"></span>';
                wnetrze += `<span>${sN}</span>`;
                grid.innerHTML += `<div onclick="otworzModalSali('${nr}')" class="relative cursor-pointer flex items-center justify-center h-10 sm:h-12 rounded-lg border ${k} text-[11px] sm:text-xs font-bold transition-all hover:scale-105 shadow-sm">${wnetrze}</div>`;
            }
        });
    });
}

function renderujUlubione() {
    const sek = document.getElementById('sekcja-ulubione'), grid = document.getElementById('grid-ulubione');
    if (!sek || !grid) return;
    if (ulubioneSale.length === 0) { ukryjEkran('sekcja-ulubione'); return; }
    pokazEkran('sekcja-ulubione', 'block'); 
    grid.innerHTML = ulubioneSale.map(nr => `<div id="ulub-sala-${nr}" onclick="otworzModalSali('${nr}')" class="${klasyKafelkaWgStatusu(aktualneStatusy[nr] || 'WOLNA')}">${wnetrzeKafelka(nr)}</div>`).join('');
}

window.ustawFiltr = function(filtr) {
    aktywnyFiltr = filtr;
    document.querySelectorAll('.filtr-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('btn-' + filtr)?.classList.add('active');
    wszystkieSale.forEach(nr => {
        const k = document.getElementById('sala-' + nr); if (!k) return;
        const st = aktualneStatusy[nr] || 'WOLNA', maF = k.dataset.fortepian === "true";
        if (filtr === 'wszystkie' || (filtr === 'wolne' && st === 'WOLNA') || (filtr === 'fortepian' && maF)) k.classList.remove('ukryta');
        else k.classList.add('ukryta');
    });
};

function nasluchujZmianSal() {
    db.ref('sale_aktualne').on('value', snap => {
        const dane = snap.val() || {};
        pelneDaneSal = dane;
        wszystkieSale.forEach(nr => {
            const dS = dane[nr], st = (typeof dS === 'string') ? dS : (dS && dS.status ? dS.status : 'WOLNA');
            aktualneStatusy[nr] = st; 
            const k = document.getElementById('sala-' + nr);
            if(k) {
                const czyU = k.classList.contains('ukryta');
                k.className = klasyKafelkaWgStatusu(st); k.innerHTML = wnetrzeKafelka(nr);
                if (czyU) k.classList.add('ukryta');
            }
        });
        if (obecnaWizualizacja === 'fizyczna') renderujTabliceFizyczna();
        renderujUlubione(); 
        ustawFiltr(aktywnyFiltr); 
        renderujWidokStart();
    });
}

window.otworzModalSali = function(nr) {
    wybranaSalaModal = nr;
    document.getElementById('akcja-sala-nr').innerText = nr;
    document.getElementById('opis-usterki-input').value = '';
    const st = aktualneStatusy[nr] || 'WOLNA', sEl = document.getElementById('akcja-sala-status');
    
    if (st === 'WOLNA') sEl.innerHTML = '<span class="emblem emblem-emerald"><span class="status-dot dot-emerald"></span>Wolna</span>';
    else if (st === 'ZAJĘTA') sEl.innerHTML = '<span class="emblem emblem-rose"><span class="status-dot dot-rose"></span>Zajęta</span>';
    else sEl.innerHTML = `<span class="emblem emblem-purple"><span class="status-dot dot-purple"></span>${ucieczkaHtml((pelneDaneSal[nr] && pelneDaneSal[nr].kto) ? pelneDaneSal[nr].kto : 'Blokada')}</span>`;
    
    const b = document.getElementById('btn-toggle-ulubiona');
    if (ulubioneSale.includes(nr)) { b.className = "w-full mb-5 py-3.5 rounded-xl font-bold text-xs border border-amber-400/50 bg-amber-500/20 text-amber-200 transition-all"; b.innerText = 'Usuń z ulubionych'; }
    else { b.className = "btn-classic-primary w-full mb-5 py-3.5 rounded-xl font-bold text-xs"; b.innerText = 'Dodaj do ulubionych'; }
    pokazEkran('modal-sala-uczen');
};

window.przelaczUlubionaSale = function() {
    if (!wybranaSalaModal || !zalogowanyUid) return;
    const i = ulubioneSale.indexOf(wybranaSalaModal);
    if (i > -1) ulubioneSale.splice(i, 1); else ulubioneSale.push(wybranaSalaModal);
    db.ref('uczniowie/' + zalogowanyUid + '/ulubione').set(ulubioneSale.length > 0 ? ulubioneSale : null);
    
    const b = document.getElementById('btn-toggle-ulubiona');
    if (ulubioneSale.includes(wybranaSalaModal)) { 
        b.className = "w-full mb-5 py-3.5 rounded-xl font-bold text-xs sm:text-sm border transition-all border-amber-400/50 bg-amber-500/20 text-amber-200"; 
        b.innerText = 'Usuń z ulubionych'; 
    } else { 
        b.className = "btn-classic-primary w-full mb-5 py-3.5 rounded-xl font-bold text-xs sm:text-sm"; 
        b.innerText = 'Dodaj do ulubionych'; 
    }
    generujTabliceKlasyczna(); if (obecnaWizualizacja === 'fizyczna') renderujTabliceFizyczna(); ustawFiltr(aktywnyFiltr); renderujUlubione();
};

window.wyslijZgloszenieUsterki = function() {
    const o = document.getElementById('opis-usterki-input').value.trim(); if (!o) return;
    db.ref('usterki_sal').push({ sala: wybranaSalaModal, opis: o, kto: `${zalogowanyUczen.imie_nazwisko} (${zalogowanyUczen.klasa || '-'})`, uid: zalogowanyUid, czas: terazDataString() }).then(() => {
        document.getElementById('opis-usterki-input').value = ''; 
        pokazAlert("Zgłoszenie wysłane", "Usterka została zarejestrowana i jest widoczna dla portierni oraz administracji.");
    });
};
window.zamknijModalSali = () => { ukryjEkran('modal-sala-uczen'); };

window.renderujAnkietyZarzadzanie = function() {
    const kon = document.getElementById('lista-ankiet-zarzadzanie');
    if (!kon) return;
    const lista = Object.entries(wszystkieAnkiety).map(e => Object.assign({ id: e[0] }, e[1])).sort((a, b) => (b.czas || '').localeCompare(a.czas || ''));
    if (lista.length === 0) { kon.innerHTML = '<p class="text-xs text-zinc-500 text-center py-4">Brak ankiet w systemie.</p>'; return; }

    kon.innerHTML = lista.map(a => {
        const czyAkt = a.aktywna !== false;
        const ileGlosow = a.glosy ? Object.keys(a.glosy).length : 0;
        return `
        <div class="p-4 bg-zinc-900/50 rounded-xl border border-white/5 flex flex-col gap-3 shadow-inner">
            <div class="flex justify-between items-start gap-2">
                <div>
                    <h4 class="font-bold text-white text-sm leading-tight">${ucieczkaHtml(a.tytul)}</h4>
                    <p class="text-[10px] text-zinc-500 mt-1">${a.czas || '-'} • Oddanych głosów: <b class="text-zinc-300">${ileGlosow}</b></p>
                </div>
                <span class="emblem ${czyAkt ? 'emblem-emerald' : 'emblem-rose'} shrink-0 text-[9px] px-2 py-1">${czyAkt ? 'Aktywna' : 'Zakończona'}</span>
            </div>
            <div class="flex flex-wrap gap-2 mt-1">
                <button onclick="otworzPodgladGlosowAnkiety('${a.id}')" class="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-200 font-bold text-xs border border-white/10 transition-colors">👥 Kto głosował (${ileGlosow})</button>
                <button onclick="zmienStatusAnkiety('${a.id}', ${czyAkt})" class="flex-1 py-2 rounded-lg bg-indigo-500/15 text-indigo-300 font-bold text-xs hover:bg-indigo-500/25 transition-colors border border-indigo-500/20">${czyAkt ? 'Zakończ' : 'Wznów'}</button>
                <button onclick="usunAnkiete('${a.id}')" class="px-3.5 py-2 rounded-lg bg-rose-500/15 text-rose-400 font-bold text-xs hover:bg-rose-500/25 transition-colors border border-rose-500/20">Usuń</button>
            </div>
        </div>`;
    }).join('');
};

window.renderujPropozycjeZarzadzanie = function() {
    const kon = document.getElementById('lista-propozycji-zarzadzanie');
    if (!kon) return;
    const lista = Object.entries(wszystkiePropozycje).map(e => Object.assign({ id: e[0] }, e[1])).sort((a, b) => (b.czas || '').localeCompare(a.czas || ''));
    if (lista.length === 0) { kon.innerHTML = '<p class="text-xs text-zinc-500 text-center py-4">Nikt jeszcze nie zgłosił żadnej propozycji.</p>'; return; }

    kon.innerHTML = lista.map(p => {
        const st = p.status || 'Nowa';
        const ileGlosow = p.glosy ? Object.keys(p.glosy).length : 0;
        return `
        <div class="p-4 sm:p-5 bg-zinc-900/50 rounded-xl border border-white/5 flex flex-col gap-3 shadow-inner">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-1">
                <div>
                    <h4 class="font-bold text-white text-sm">${ucieczkaHtml(p.tytul)}</h4>
                    <p class="text-[10px] text-zinc-400 mt-1">${ucieczkaHtml(p.anonim ? `Anonimowo (Autor: ${p.autor_prawdziwy})` : p.autor_prawdziwy)} • ${p.czas}</p>
                </div>
                <select onchange="zmienStatusPropozycji('${p.id}', this.value)" class="input-classic rounded-lg text-xs py-1.5 px-3 cursor-pointer w-full sm:w-auto font-bold text-amber-300">
                    <option value="Nowa" ${st === 'Nowa' ? 'selected' : ''}>📌 Nowa</option>
                    <option value="Zaakceptowana" ${st === 'Zaakceptowana' ? 'selected' : ''}>✅ Zaakceptowana</option>
                    <option value="W realizacji" ${st === 'W realizacji' ? 'selected' : ''}>⏳ W realizacji</option>
                    <option value="Odrzucona" ${st === 'Odrzucona' ? 'selected' : ''}>❌ Odrzucona</option>
                </select>
            </div>
            <div class="p-3 bg-[#0a0a0f] rounded-lg border border-white/5">
                <p class="text-xs text-zinc-300 italic whitespace-pre-line">"${ucieczkaHtml(p.opis)}"</p>
            </div>
            <div class="flex flex-col gap-2 mt-2">
                <label class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Oficjalna Odpowiedź Samorządu:</label>
                <textarea id="odpowiedz-admina-${p.id}" class="input-classic rounded-xl p-3 text-xs w-full resize-none leading-relaxed" rows="2" placeholder="Wpisz odpowiedź, która będzie widoczna dla wszystkich...">${ucieczkaHtml(p.odpowiedz_admina || '')}</textarea>
                <div class="flex flex-wrap gap-2 mt-1">
                    <button onclick="otworzPodgladGlosowPropozycji('${p.id}')" class="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 font-bold text-xs border border-white/10 transition-colors">👥 Kto głosował (${ileGlosow})</button>
                    <button onclick="zapiszOdpowiedzSamorzadu('${p.id}')" class="flex-1 py-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 font-bold text-xs hover:bg-indigo-500/30 transition-colors border border-indigo-500/30">Zapisz i Opublikuj</button>
                    <button onclick="usunPropozycje('${p.id}')" class="px-4 py-2.5 rounded-xl bg-rose-500/15 text-rose-400 font-bold text-xs hover:bg-rose-500/25 transition-colors border border-rose-500/20">Usuń</button>
                </div>
            </div>
        </div>`;
    }).join('');
};

function pobierzNazweUczniaPoUid(uid) {
    const u = pelnaBazaUczniow[uid];
    if (u && u.imie_nazwisko) return `${u.imie_nazwisko} (${u.klasa || '-'})`;
    return `Użytkownik (${String(uid).substring(0, 6)})`;
}

window.otworzPodgladGlosowAnkiety = function(id) {
    const a = wszystkieAnkiety[id];
    if (!a) return;
    document.getElementById('podglad-glosow-tytul').innerText = a.tytul || 'Głosy w ankiecie';
    const kontener = document.getElementById('podglad-glosow-lista');
    const opcje = Array.isArray(a.opcje) ? a.opcje : [];
    const glosy = a.glosy || {};

    const grupy = opcje.map(() => []);
    Object.entries(glosy).forEach(([uid, opcIdx]) => {
        if (grupy[opcIdx]) grupy[opcIdx].push(pobierzNazweUczniaPoUid(uid));
    });

    kontener.innerHTML = opcje.map((nazwaOpcji, idx) => {
        const osoby = grupy[idx] || [];
        return `
        <div class="p-4 rounded-xl bg-zinc-900/70 border border-white/10">
            <div class="flex justify-between items-center mb-2 pb-2 border-b border-white/5">
                <span class="font-bold text-white text-xs sm:text-sm">${ucieczkaHtml(nazwaOpcji)}</span>
                <span class="emblem emblem-indigo">${osoby.length} gł.</span>
            </div>
            ${osoby.length > 0 
                ? `<div class="flex flex-wrap gap-1.5">${osoby.map(os => `<span class="text-[11px] bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-zinc-200">${ucieczkaHtml(os)}</span>`).join('')}</div>`
                : `<p class="text-[11px] text-zinc-500 italic">Brak głosów na tę opcję.</p>`
            }
        </div>`;
    }).join('');

    pokazEkran('modal-podglad-glosow');
};

window.otworzPodgladGlosowPropozycji = function(id) {
    const p = wszystkiePropozycje[id];
    if (!p) return;
    document.getElementById('podglad-glosow-tytul').innerText = p.tytul || 'Głosy w propozycji';
    const kontener = document.getElementById('podglad-glosow-lista');
    const glosy = p.glosy || {};

    const glosyZa = [], glosyPrzeciw = [];
    Object.entries(glosy).forEach(([uid, typ]) => {
        if (typ === 'za') glosyZa.push(pobierzNazweUczniaPoUid(uid));
        else if (typ === 'przeciw') glosyPrzeciw.push(pobierzNazweUczniaPoUid(uid));
    });

    kontener.innerHTML = `
        <div class="p-4 rounded-xl bg-emerald-950/25 border border-emerald-500/30">
            <div class="flex justify-between items-center mb-2 pb-2 border-b border-emerald-500/20">
                <span class="font-bold text-emerald-300 text-xs sm:text-sm">👍 Głosy ZA</span>
                <span class="emblem emblem-emerald">${glosyZa.length}</span>
            </div>
            ${glosyZa.length > 0 
                ? `<div class="flex flex-wrap gap-1.5">${glosyZa.map(os => `<span class="text-[11px] bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-zinc-200">${ucieczkaHtml(os)}</span>`).join('')}</div>`
                : `<p class="text-[11px] text-zinc-500 italic">Brak głosów poparcia.</p>`
            }
        </div>
        <div class="p-4 rounded-xl bg-rose-950/25 border border-rose-500/30">
            <div class="flex justify-between items-center mb-2 pb-2 border-b border-rose-500/20">
                <span class="font-bold text-rose-300 text-xs sm:text-sm">👎 Głosy PRZECIW</span>
                <span class="emblem emblem-rose">${glosyPrzeciw.length}</span>
            </div>
            ${glosyPrzeciw.length > 0 
                ? `<div class="flex flex-wrap gap-1.5">${glosyPrzeciw.map(os => `<span class="text-[11px] bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-zinc-200">${ucieczkaHtml(os)}</span>`).join('')}</div>`
                : `<p class="text-[11px] text-zinc-500 italic">Brak głosów sprzeciwu.</p>`
            }
        </div>
    `;
    pokazEkran('modal-podglad-glosow');
};

window.dodajAnkieteSamorzad = function() {
    const t = document.getElementById('nowa-ankieta-tytul').value.trim();
    const o = document.getElementById('nowa-ankieta-opis').value.trim();
    const opStr = document.getElementById('nowa-ankieta-opcje').value.trim();
    
    if (t.length < 5 || opStr.length < 3) { pokazAlert("Uwaga", "Wpisz tytuł i minimum 2 opcje po przecinku."); return; }
    const opcjeArr = opStr.split(',').map(s => s.trim()).filter(Boolean);
    if (opcjeArr.length < 2) { pokazAlert("Uwaga", "Podaj minimum 2 opcje oddzielone przecinkiem."); return; }

    db.ref('samorzad_ankiety').push({
        tytul: t, opis: o, opcje: opcjeArr, czas: terazDataString(), aktywna: true
    }).then(() => {
        document.getElementById('nowa-ankieta-tytul').value = '';
        document.getElementById('nowa-ankieta-opis').value = '';
        document.getElementById('nowa-ankieta-opcje').value = '';
        pokazAlert("Sukces", "Ankieta została opublikowana.");
    });
};

window.zmienStatusAnkiety = function(id, obecnyStatus) { db.ref(`samorzad_ankiety/${id}/aktywna`).set(!obecnyStatus); };

window.usunAnkiete = function(id) {
    pokazConfirm("Usuwanie", "Czy na pewno chcesz bezpowrotnie usunąć tę ankietę?", () => {
        db.ref(`samorzad_ankiety/${id}`).remove();
    });
};

window.zmienStatusPropozycji = function(id, status) { db.ref(`samorzad_propozycje/${id}/status`).set(status); };

window.zapiszOdpowiedzSamorzadu = function(id) {
    const txt = document.getElementById(`odpowiedz-admina-${id}`).value.trim();
    db.ref(`samorzad_propozycje/${id}/odpowiedz_admina`).set(txt).then(() => {
        pokazAlert("Sukces", "Odpowiedź Samorządu została przypięta do tej propozycji.");
    });
};

window.usunPropozycje = function(id) {
    pokazConfirm("Usuwanie propozycji", "Czy na pewno usunąć tę propozycję zgłoszoną przez ucznia?", () => {
        db.ref(`samorzad_propozycje/${id}`).remove();
    });
};