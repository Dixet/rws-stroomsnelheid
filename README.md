# RWS Stroomsnelheid

Deze pagina helpt duikers in Zeeland om een inschatting te maken van stroming rond een gekozen duiklocatie en tijdsperiode.

<a href='https://ko-fi.com/V4M3244P6B' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi5.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
## Waarvoor kun je deze pagina gebruiken?

Je gebruikt de pagina om:

- een duiklocatie te kiezen;
- een periode (start/einde) te selecteren;
- te zien wanneer de stroming gunstiger of minder gunstig is om te duiken;
- een overzicht te krijgen in duikvensters en stromingsdetails.

## Voor wie is deze pagina bedoeld?

Deze pagina is bedoeld voor duikers die in Zeeland duiken en vooraf een praktische indicatie van stroming willen bekijken bij het plannen van een duik.

## Herkomst van de gegevens

De gegevens op deze pagina komen van **[Rijkswaterstaat Waterberichtgeving](https://waterberichtgeving.rws.nl/owb/regio/regio-zeeuwse-wateren/duikstekken-zeeland)** (RWS API).
De kaartachtergrond komt van OpenStreetMap.

## Gebruik in het kort

1. Open de pagina in je browser.
2. Kies een locatie (via lijst of kaart).
3. Stel start- en einddatum/tijd in.
4. Klik op **Toon stroming**.
5. Bekijk de duikvensters en stromingsdetails.

## Uitleg van het scherm

### 1) Gebruikersinvoer
<img width="1299" height="491" alt="Screenshot 2026-03-03 132451" src="https://github.com/user-attachments/assets/03539ccd-e015-4c29-8495-331704a95505" />

De invoersectie gebruik je om te bepalen **voor welke locatie** en **voor welke periode** je stromingsinformatie wilt ophalen.

- **Duikplaats**
	- Betekenis: de locatie waarvoor je stroming wilt bekijken.
	- Gebruik: kies een locatie uit de lijst, of klik een marker op de kaart om dezelfde locatie direct te selecteren.
- **Toon alleen duiklocaties**
	- Betekenis: filtert de lijst en kaart op locaties die als officiële duiklocatie bekend zijn.
	- Gebruik: aangevinkt = alleen duiklocaties; uitgevinkt = alle beschikbare meetlocaties.
- **Kaart (rechts of onder het formulier op mobiel)**
	- Betekenis: visueel overzicht van beschikbare locaties.
	- Gebruik: klik op een marker om die locatie te kiezen in de lijst.
- **Startdatum / Starttijd**
	- Betekenis: begin van de periode waarvoor je een voorspelling wilt zien.
	- Gebruik: kies het gewenste startmoment.
- **Einddatum / Eindtijd**
	- Betekenis: einde van de periode.
	- Gebruik: kies een tijd na het startmoment (de pagina voorkomt een eindtijd vóór starttijd).
- **Toon duikvensters**
	- Betekenis: haalt de gegevens op en toont resultaten.
	- Gebruik: klik nadat locatie en periode zijn ingevuld.
### 2) Legenda
<img width="500" alt="legenda" src="https://github.com/user-attachments/assets/e530f21e-ce42-412c-b3c1-f46176c64203" />

De stroomsnelheid wordt in kleurgradaties weergegeven van rood (duiken afgeraden) tot groen (lichte stroming). 
Daarnaast wordt een icoon getoond voor de maanfasen, en de daaropvolgende spring- of doodtij. 

### 2) Duikvensters
<img width="889" height="431" alt="image" src="https://github.com/user-attachments/assets/9d2ed7b9-0c50-4122-9f91-edbf161a0dc6" />

In dit onderdeel zie je een samenvatting van de meest bruikbare duikmomenten binnen de gekozen periode.

- **Datumscheiding**
	- Betekenis: toont de datum waarop het duikvenster valt (gemeten voor het moment van kentering)
 	- Lezen: naast de datum wordt indien van toepassing de maanfase of spring- of doodtij icoon getoond 
- **Tijdlijnen per dag/per venster**
	- Betekenis: laten zien hoe de stroming in de tijd verandert.
	- Lezen: Iedere balk toont een venster van piekstroming tot piekstroming, met kleur- en tijdsmarkeringen voor verschillende stroomsnelheden tussen die pieken
- **Kleuren in de balken**
	- Betekenis: geven de sterkte van de stroming aan (zie legenda).
	- Lezen: gunstiger stukken zijn rustiger kleuren; ongunstiger stukken zijn waarschuwingskleuren.
- **Tijdlabels en markeringen**
	- Betekenis: tonen belangrijke omslagpunten in de stroming.
	- Lezen: gebruik deze tijden om je duikplanning (te water, omkeren, uit water) beter te timen.

### 3) Detailvenster
<img width="700" alt="image" src="https://github.com/user-attachments/assets/12d26e55-4c8f-4b2d-8f58-d79c41926ae1" />

Wanneer geklikt wordt op het vergrootglas 🔍 of op het duikvenster opent een detailscherm met:
- **Detailinformatie**
    - Lengte en start- en eindtijd van de duikvensters
    - Getij-extreem en tijdstip van de stromingskentering
- **Grafiek**
    - Grafiek met daarin de stroomsnelheid (y-as) op ieder tijdstip (x-as)
    - Boven de grafiek wordt op ieder tijdstip de stromingsrichting aangegeven met een windrichtingspijl (↑ = noord)
    - Aanwijzer voor het tijdstip van de kentering 

### 4) Stromingsdetails
<img width="1288" height="841" alt="Screenshot 2026-03-03 140321" src="https://github.com/user-attachments/assets/f8163199-5f45-4c80-94fd-c2cc6fbe853b" />

Dit onderdeel geeft de gedetailleerde metingen in tabelvorm.

- **Stromingsdetails (uitklapbaar kopje)**
	- Betekenis: opent/sluit de detailtabel.
	- Lezen: open dit onderdeel als je exacte waarden per tijdstip nodig hebt.
- **Kolom Datum**
	- Betekenis: de dag van de meting.
- **Kolom Tijd**
	- Betekenis: het lokale tijdstip van de meting.
- **Kolom Stroming (cm/s)**
	- Betekenis: verwachte stromingssnelheid in centimeter per seconde op dat moment.
	- Lezen: lagere waarden zijn meestal gunstiger voor een rustige duik.
- **Kolom Richting (°)**
	- Betekenis: richting van de stroming in graden (met kompasrichting).
	- Lezen: helpt bij inschatten van drift en oriëntatie tijdens de duik.
- **Rijkleuren in de tabel**
	- Betekenis: visuele aanduiding van rustige/sterke stroming en belangrijke momenten.
	- Lezen: gebruik kleur als snelle indicatie, en controleer daarna de exacte cijfers.

## Beperkingen
- Deze pagina is een hulpmiddel en geen veiligheidsgarantie.
- Beschikbaarheid en juistheid hangen af van externe bronnen (Rijkswaterstaat en kaartdiensten).
- Er kan vertraging of tijdelijke uitval zijn in aangeleverde data.
- Lokale omstandigheden (weer, zicht, getij-effecten op exacte plek) kunnen afwijken van de getoonde waarden.
- Gebruik altijd eigen beoordeling en volg lokale duik- en veiligheidsrichtlijnen.
