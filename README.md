# <img style="width: 1.3em;" alt="Screenshot 2026-03-03 132451" src="https://www.stromingsgids.nl/images/android-chrome-512x512.png" /> RWS Stroomsnelheid
Deze pagina helpt duikers in Zeeland om een inschatting te maken van stroming rond een gekozen duiklocatie en tijdsperiode.

## Waarvoor is deze site bedoeld?
Wil je duiken in de Oosterschelde? Dan is het handig om vooraf te weten hoe hard het water stroomt. Deze site helpt je daarbij: je kiest een duiklocatie en een periode, en je ziet direct wanneer de stroming rustig genoeg is om te duiken en wanneer je beter kunt wachten.

Zo kun je je duik plannen rond de momenten met de minste stroming, in plaats van te gokken of achteraf verrast te worden door een sterke stroom.

## Voor wie is deze pagina bedoeld?
Deze pagina is bedoeld voor duikers die in Zeeland duiken en vooraf een praktische indicatie van stroming willen bekijken bij het plannen van een duik.

## Herkomst van de gegevens
De gegevens op deze pagina komen van **[Rijkswaterstaat Waterberichtgeving](https://waterberichtgeving.rws.nl/owb/regio/regio-zeeuwse-wateren/duikstekken-zeeland)** (RWS API).
Rijkswaterstaat maakt een voorspelling van de stroomsnelheid maximaal 36 uur vooruit. Verder vooruit kan je dus ook met deze pagina niet kijken. 

## Gebruik in het kort
1. Open de pagina in je browser.
2. Kies een locatie (via lijst of kaart).
3. Stel start- en einddatum/tijd in.
4. Klik op **Toon duikvensters**.
5. Bekijk de duikvensters en stromingsdetails.

## Uitleg van het scherm
### 1) Gebruikersinvoer
<img style="width: 90%;margin-left: auto;margin-right: auto;" alt="Screenshot 2026-03-03 132451" src="https://github.com/user-attachments/assets/03539ccd-e015-4c29-8495-331704a95505" />

De invoersectie gebruik je om te bepalen **voor welke locatie** en **voor welke periode** je stromingsinformatie wilt ophalen.

- **Duikplaats**
	- Kies een locatie uit de lijst, of klik een marker op de kaart om dezelfde locatie direct te selecteren.
- **Toon alleen duiklocaties**
	- Aangevinkt = alleen duiklocaties; uitgevinkt = alle beschikbare meetlocaties.
- **Kaart (rechts of onder het formulier op mobiel)**
	- Klik op een marker om die locatie te kiezen in de lijst.
- **Startdatum / Starttijd**
	- Kies het gewenste moment vanaf wanneer je de stroming wilt zien. Maximaal 1 dag in de toekomst, verder vooruit voorspelt Rijkswaterstaat geen stroming.
- **Einddatum / Eindtijd**
	- Kies een tijd tot wanneer je de stromingsvoorspelling wilt zien. Maximaal 3 dagen ivm de hoeveelheid te verwerken gegevens.
- **Toon duikvensters**
	- Klik nadat locatie en periode zijn ingevuld om de duikvensters te zien.
   
### 2) Legenda
De stroomsnelheid wordt in kleurgradaties weergegeven van rood (duiken afgeraden) tot groen (lichte stroming). 
Daarnaast wordt een icoon getoond voor de maanfasen, en de daaropvolgende spring- of doodtij. 

### 2) Duikvensters
<img style="width: 90%;margin-left: auto;margin-right: auto;" src="https://github.com/user-attachments/assets/9d2ed7b9-0c50-4122-9f91-edbf161a0dc6" />

In dit onderdeel zie je een samenvatting van de meest bruikbare duikmomenten binnen de gekozen periode.

- **Datumscheiding**
	- Toont de datum waarop het duikvenster valt (gemeten op het moment van kentering). Naast de datum wordt indien van toepassing de maanfase of spring- of doodtij icoon getoond
- **Tijdlijnen per dag/per venster**
	- De duikvensters laten zien hoe de stroming in de tijd verandert. Iedere balk toont een venster van piekstroming tot piekstroming, met kleur- en tijdsmarkeringen voor verschillende stroomsnelheden tussen die pieken
	- Deze keluren geven de sterkte van de stroming aan (zie legenda). Gunstiger stroming wordt weergegeven met rustiger kleuren; ongunstiger periodes zijn waarschuwingskleuren.
- **Tijdlabels en markeringen**
	- De labels tonen belangrijke omslagpunten in de stroming. Gebruik deze tijden om je duikplanning (te water, omkeren, uit water) beter te timen.

### 3) Detailvenster
<img style="width: 90%;margin-left: auto;margin-right: auto;" alt="image" src="https://github.com/user-attachments/assets/12d26e55-4c8f-4b2d-8f58-d79c41926ae1" />

Je kan klikken op de chevron › of op het duikvenster om details te zien met:
- **Detailinformatie**
    - Lengte en start- en eindtijd van de duikvensters
    - Tijdstip en extreemtype van de kentering
    - Getij-extreem en tijdstip van de stromingskentering
- **Grafiek**
    - Grafiek met daarin de stroomsnelheid (y-as) op ieder tijdstip (x-as)
    - Boven de grafiek wordt op ieder tijdstip de stromingsrichting aangegeven met een windrichtingspijl (↑ = noord)
    - Aanwijzer voor het tijdstip van de kentering 

### 4) Stromingsdetails
<img style="width: 90%;margin-left: auto;margin-right: auto;" alt="Screenshot 2026-03-03 140321" src="https://github.com/user-attachments/assets/f8163199-5f45-4c80-94fd-c2cc6fbe853b" />

Dit onderdeel geeft de gedetailleerde metingen in tabelvorm.

- **Stromingsdetails (uitklapbaar kopje)**
	- Open dit onderdeel als je exacte waarden per tijdstip nodig hebt door the klikken op de kop "Stromingsdetails".
- **Kolom Datum**
	- Betekenis: de dag van de meting.
- **Kolom Tijd**
	- Betekenis: het lokale tijdstip van de meting.
- **Kolom Stroming (cm/s)**
	- Betekenis: verwachte stromingssnelheid in centimeter per seconde op dat moment.
	- Lagere waarden zijn meestal gunstiger voor een rustige duik.
- **Kolom Richting (°)**
	- Betekenis: richting van de stroming in graden (met kompasrichting).
	- Helpt bij inschatten van drift en oriëntatie tijdens de duik.
- **Rijkleuren in de tabel**
	- Betekenis: visuele aanduiding van rustige/sterke stroming en belangrijke momenten.
	- Lezen: gebruik kleur als snelle indicatie, en controleer daarna de exacte cijfers.

## Beperkingen
- Deze pagina is een hulpmiddel en geen veiligheidsgarantie.
- Beschikbaarheid en juistheid hangen af van externe bronnen (Rijkswaterstaat en kaartdiensten).
- Er kan vertraging of tijdelijke uitval zijn in aangeleverde data.
- Lokale omstandigheden (weer, zicht, getij-effecten op exacte plek) kunnen afwijken van de getoonde waarden.
- Gebruik altijd eigen beoordeling en volg lokale duik- en veiligheidsrichtlijnen.

<a href='https://ko-fi.com/V4M3244P6B' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi5.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
