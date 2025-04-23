import 'dotenv/config';
import {
  App
}
from '@tinyhttp/app';
import {
  logger
}
from '@tinyhttp/logger';
import {
  Liquid
}
from 'liquidjs';
import sirv from 'sirv';

const engine = new Liquid({
  extname: '.liquid',
});

const app = new App();
const apiKey = process.env.API_KEY;
const apiKeyFreepik = process.env.API_KEY_FREEPIK;

app
  .use(logger())
  .use('/', sirv('dist'))
  .use('/public', sirv('public'))
  .listen(3000, () => console.log('Server available on http://localhost:3000'));

// Lijst van steden met hun tijdzones
const cities = [{
    name: 'Amsterdam',
    timezone: 'Europe/Amsterdam'
  },
  {
    name: 'Valencia',
    timezone: 'Europe/Madrid'
  },
  {
    name: 'Paris',
    timezone: 'Europe/Paris'
  },
  {
    name: 'Sydney',
    timezone: 'Australia/Sydney'
  },
  {
    name: 'Berlin',
    timezone: 'Europe/Berlin'
  },
  {
    name: 'Helsinki',
    timezone: 'Europe/Helsinki'
  },
];
// Hier maak ik 6 verschillende steden aan

// Functie om de lokale tijd van een stad op te halen via de tijdzone
function getCityWeather(timezone) {
  return new Intl.DateTimeFormat('nl-NL', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date());
}
// Hier haal ik de tijd per stad op

// Route voor de homepage
app.get('/', async (req, res) => {
  const allLocationsWeather = []; // Hier slaan we alle weergegevens op
  let weatherIcon;

  for (const city of cities) {
    // Vraag weerdata op voor elke stad via de OpenWeatherMap API
    const weather = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city.name}&appid=${apiKey}&units=metric`);
    const weatherData = await weather.json();

    // Haal het icoon-ID op uit de weerdata
    const weatherIconId = weatherData.weather[0].icon;

    // Maak de URL aan voor het icoon
    if (weatherIconId) {
      weatherIcon = `https://openweathermap.org/img/wn/${weatherIconId}@2x.png`;
    }

    // Voeg lokale tijd toe aan de data
    weatherData.time = getCityWeather(city.timezone);

    // Voeg het icoon toe aan de juiste plek in de data
    weatherData.weather[0].icon = weatherIcon;

    // Voeg alles toe aan de lijst
    allLocationsWeather.push(weatherData);
  }

  console.log(allLocationsWeather);

  // Geef de homepage weer met de opgehaalde weerdata
  return res.send(renderTemplate('server/views/index.liquid', {
    weather: allLocationsWeather
  }));
});

// Route voor een specifieke stadspagina
app.get('/:city/', async (req, res) => {
  const city = req.params.city; // Haal de stadsnaam uit de URL
  const item = cities.find((item) => item.name === city); // Zoek of de stad in onze lijst zit

  // Als de stad niet bestaat, stuur 404 terug
  if (!item) {
    return res.status(404).send('Not found');
  }




  // Stel headers in voor Freepik API
  const options = {
    method: 'GET',
    headers: {
      'x-freepik-api-key': apiKeyFreepik
    }
  };

  // Vraag afbeelding op van Freepik op basis van stad
  const imageFetch = fetch(`https://api.freepik.com/v1/resources?filters[ai-generated][excluded]=1&term=${city}&filters[content_type][photo]=1`, options)
    .then(response => response.json())
    .catch(err => console.error(err));

  const images = await imageFetch;

  // Haal de eerste afbeelding uit de resultaten
  const cityImage = await images.data[0].image.source.url;

  // Vraag het weer op van OpenWeatherMap API
  const weather = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
  const weatherData = await weather.json();

  // Haal het icoon op
  const weatherIconId = await weatherData.weather[0].icon;

  let weatherIcon;

  // Maak de URL aan voor het icoon
  if (weatherIconId) {
    weatherIcon = `https://openweathermap.org/img/wn/${weatherIconId}@2x.png`;
  }

  // Voeg lokale tijd toe aan de weerdata
  weatherData.time = getCityWeather(item.timezone);

  // Toon de detailpagina met alle data
  return res.send(renderTemplate('server/views/detail.liquid', {
    title: `Detail page for ${city}`,
    item,
    image: cityImage,
    weather: weatherData,
    weatherIcon: weatherIcon,
  }));
});


const renderTemplate = (template, data) => {
  const templateData = {
    NODE_ENV: process.env.NODE_ENV || 'production',
    ...data
  };

  return engine.renderFileSync(template, templateData);
};
