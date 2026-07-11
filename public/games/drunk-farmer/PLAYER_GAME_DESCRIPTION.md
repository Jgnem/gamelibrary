# The Drunk Farmer - Spelarbeskrivning

The Drunk Farmer är ett klusterbaserat slotspel på ett 6x6-spelfält. I stället för traditionella vinstlinjer vinner spelaren genom att få grupper av matchande symboler som sitter ihop vågrätt eller lodrätt. Varje snurr kan ge klustervinster, tumbles, kyckling-wilds och flaskor till Buzz-mätaren – och när mätaren blir full vinner spelaren free spins. Med riktig tur kan en Full Buzz-flaska fylla mätaren i en enda klunk – free spins är teoretiskt möjliga redan på första snurret.

Alla vinster visas som multiplar av insatsen, till exempel 2.50x eller 25.00x.

## Basspelet

Basspelet spelas på ett rutnät med 6 kolumner och 6 rader, totalt 36 positioner. Varje snurr fyller hela fältet med symboler från spelets symboluppsättning.

Spelet använder klustervinster. En vinst uppstår när minst 5 likadana betalande symboler ligger sammanhängande med varandra. Symbolerna behöver inte ligga på rad; det räcker att de nuddar varandra horisontellt eller vertikalt och bildar ett sammanhängande område. Diagonal kontakt räknas inte.

En Wild kan räknas in i ett kluster och hjälpa det att nå 5+ symboler, men ett kluster måste alltid innehålla minst en riktig betalande symbol – rena wild-kluster betalar inte. Om en Wild kan passa in i flera möjliga kluster tilldelas den det största först.

När ett eller flera vinnande kluster hittas betalas de enligt betaltabellen. Större kluster ger högre vinster. Efter utbetalningen tas de vinnande symbolerna bort från fältet och resterande symboler faller ned för att fylla tomrummen. Nya symboler faller sedan in uppifrån. Detta kallas tumble eller cascade.

Efter varje tumble kontrolleras fältet igen. Om nya kluster har bildats betalas de också, tas bort och ersätts av nya symboler. Detta fortsätter tills inga nya vinnande kluster finns kvar, eller tills säkerhetsgränsen på 7 cascade-steg per betalt snurr nås. Alla vinster från samma snurr läggs ihop.

Ju längre kedjan blir, desto mer betalar den: från och med fjärde cascade-steget multipliceras stegets klustervinster med en stegmultiplikator som växer med kedjan.

| Cascade-steg | Vinstmultiplikator |
|---|---:|
| 1–3 | x1 |
| 4 | x2 |
| 5 | x2 |
| 6 | x3 |
| 7 | x4 |

## Symboler i basspelet

De lägre betalande symbolerna är 10, J, Q, K och A. De förekommer oftare och ger lägre klustervinster.

De medelhöga symbolerna är Haystack och Cassava. De förekommer mer sällan än kortsymbolerna och betalar bättre.

De högre betalande symbolerna är Pitchfork och Dog. De förekommer mer sällan och står för de högre klustervinsterna i basspelet.

Wild-symbolen i basspelet är en kyckling. En kyckling är alltid en Wild: den ersätter betalande symboler och hjälper till att skapa eller förstärka kluster. Wild har ingen egen direkt utbetalning.

## Kyckling-Wild och skott

Kycklingarna på fältet är själva Wild-symbolerna – de visas som kycklingar och fungerar som wilds oavsett vad som händer. Bonden skjuter dem inte för att göra dem till wilds; de är redan wilds. Ett skott lägger bara till en förstärkning (buff) på kycklingens ruta.

Bonden skjuter en kyckling först när den ingår i ett vinnande kluster som har bildats. När det händer kan han skjuta den, och chansen att skottet sker styrs av flaskmätarens nivå när snurret börjar: ju fullare mätare, desto större chans. En kyckling som inte hamnar i ett kluster – eller som hamnar där men inte träffas – är bara en vanlig Wild utan buff.

Skotten är avsiktligt sällsynta men stora: när en kyckling skjuts i ett kluster får den ett buff-värde (x3, x5 eller x10) på sin ruta, och hela den klustervinsten multipliceras med buff-värdet. Om flera skjutna kycklingar ingår i samma kluster läggs deras buff-värden ihop. Buff-värdet dras slumpmässigt – x3 är vanligast, x10 sällsynt (vikter 70 / 25 / 5).

Skottchansen styrs av Buzz-mätarens nivå in i snurret, och skillnaden ska kännas: en nykter bonde skjuter nästan aldrig, en riktigt packad bonde skjuter nästan var tredje klustrad kyckling (placeholder-värden som balanseras separat):

| Buzz-nivå | Skottchans per klustrad kyckling |
|---|---:|
| 0–33% | 2,5% |
| 34–67% | 8% |
| 68%+ | 30% |

Bonden visar också vad som pågår: ju fullare Buzz-mätare, desto fullare ser han ut – och när en kyckling hamnar i ett vinnande kluster utan att skjutas höjer han ändå geväret och tvekar innan han sänker det igen.

## Free spins – när mätaren blir full

När Buzz-mätaren når toppen vinner spelaren **5 free spins**. Free spins kostar ingen insats och spelas automatiskt i följd.

Varje free spin-bräde fylls på med kycklingar tills det finns **minst 3 kycklingar** på fältet – bonden ska alltid ha något att sikta på. Under varje free spin skjuter han sedan **varenda kyckling** som hamnar i ett vinnande kluster (100% skottchans) – fem snurr av rent raseri. Free spin-skottens buffar gäller bara sina kluster i det snurret och lämnar inga väntande brickor – det är sprej, inte prickskytte. Väntande ×-brickor från tidigare betalda snurr fungerar däremot som vanligt och kan träffas och förbrukas även under free spins.

Överskjutande alkohol går aldrig förlorad: om flaskan som fyller mätaren skjuter över toppen förs överskottet över till nästa mätarcykel. Under free spins är mätaren fryst – inga nya flaskor dyker upp medan bonden skjuter.

Alla vinster under free spins-omgången läggs ihop och hela omgången kan som mest ge maxvinsten 5000x.

## Kvarliggande buff – ligger kvar tills den används

Efter skottet försvinner buffen inte: den ligger kvar på sin ruta som en synlig ×-bricka, hur många snurr det än tar. Nästa gång ett vinnande kluster täcker den rutan multipliceras hela den klustervinsten med brickans värde – och därefter är brickan förbrukad. Varje skott ger alltså exakt två utdelningar: klustret där kycklingen sköts, och ett framtida kluster som täcker rutan (en bricka multiplicerar bara det första klustret som täcker den under ett snurr). Landar ett nytt skott på en ruta som redan har en väntande bricka läggs värdena ihop (max x25 per ruta). Free spin-skott lämnar inga brickor.

**Brickorna jäser:** en bricka som väntar utan att träffas växer med +1 i värde för var tionde snurr den överlever, upp till maxvärdet x25. Ju längre du väntar, desto större blir utdelningen när den till slut träffas.

## Sticky Wild

När en kyckling-Wild ingår i ett vinnande kluster blir den sticky och ligger kvar på sin position under resten av samma snurr, medan andra vinnande symboler försvinner och nya faller in. Det ger en extra chans att bilda fler kluster i samma snurr. Det kan finnas som mest 3 sticky wilds samtidigt under ett snurr, och stickyeffekten gäller bara det pågående snurret.

## Temporary Wilds

När en cascade-kedja blir längre kan spelet lägga till en tillfällig Wild för att ge längre tumbles mer energi. En Temporary Wild gäller bara den aktuella cascade-sekvensen, blir aldrig sticky och försvinner efter användning. Den placeras aldrig på en ruta som redan är en Wild eller en sticky wild.

Chansen ökar med cascade-steget:

| Cascade-steg | Chans för en Temporary Wild |
|---|---:|
| Steg 1 | Ingen |
| Steg 2 | 30% |
| Steg 3 | 60% |
| Steg 4–7 | Garanterad |

## Buzz-mätaren och flaskorna

Under basspelet kan en flaska dyka upp på ett snurr. Flaskor är inte vanliga betalande symboler, utan matar Buzz-mätaren som styr hur ofta bonden skjuter kycklingar – och som ger free spins när den blir full.

Grundchansen att få en flaska är 8% och ökar med 2 procentenheter för varje snurr utan flaska. När en flaska väl dyker upp nollställs den ökande chansen. Flaskorna kommer alltså oregelbundet – ibland flera tätt inpå varandra, ibland med långa törstiga väntetider – men i snitt ungefär var sjätte snurr.

**Varje flaska innehåller alkohol – det finns inga tomma flaskor.** Det som varierar är hur hårt den slår:

| Flaska | Fyller mätaren | Sällsynthet (vikt) |
|---|---:|---:|
| Small Buzz | +5% | vanlig (58) |
| Big Buzz | +12% | mellan (29) |
| Mega Buzz | +25% | sällsynt (10) |
| Ultra Buzz | +50% | mycket sällsynt (2.5) |
| ★ Full Buzz | +100% | extremt sällsynt (0.5) |

Varje flaska bonden dricker syns direkt på mätaren. En Mega Buzz är en händelse i sig – en fjärdedel av mätaren i en klunk. Ultra Buzz fyller halva mätaren på en gång, och Full Buzz gör precis vad namnet säger: **hela mätaren i ett svep**. Hittar bonden en Full Buzz är free spins garanterade direkt, oavsett hur tom mätaren var – teoretiskt redan på spelets allra första snurr.

Mätarens nivå in i snurret avgör vilket skottchans-steg som gäller (se tabellen ovan). När mätaren når toppen vinner spelaren 5 free spins (se Free spins ovan), och överskottet över toppen förs över till nästa mätarcykel – ingen alkohol slösas.

## Vinstbegränsning

Spelet har en maxvinst på 5000x insatsen. Om den totala vinsten för en runda når maxvinsten stoppas vidare ökning av vinsten vid denna gräns. En free spins-omgång räknas som en runda: hela omgångens sammanlagda vinst kan som mest bli 5000x.

## Kort sammanfattning

1. Snurra i basspelet på ett 6x6-klusterfält.
2. Få vinster med 5 eller fler matchande symboler som sitter ihop horisontellt eller vertikalt.
3. Vinnande symboler försvinner och nya faller in genom tumble-funktionen – upp till 7 steg, där steg 4–7 multiplicerar stegets vinster med x2/x2/x3/x4.
4. Kyckling-Wilds ersätter andra symboler; när en kyckling ingår i ett vinnande kluster kan bonden skjuta den och multiplicera hela den klustervinsten (x3/x5/x10). Buffen ligger sedan kvar på rutan som en väntande ×-bricka tills ett vinnande kluster täcker rutan igen – då multipliceras även det klustret och brickan förbrukas. Väntande brickor jäser (+1 per 10 snurr, max x25).
5. Varje flaska innehåller alkohol och fyller Buzz-mätaren: Small Buzz +5% (vanlig), Big Buzz +12%, Mega Buzz +25%, Ultra Buzz +50% (mycket sällsynt), Full Buzz +100% (extremt sällsynt – free spins direkt). Ju fullare mätare, desto oftare skjuter bonden (2,5% → 8% → 30%).
6. Full mätare → **5 free spins** utan insats, med minst 3 kycklingar på varje bräde och 100% skottchans på varje klustrad kyckling. Överskottet i mätaren förs över till nästa cykel.
7. Maxvinst 5000x per runda.
