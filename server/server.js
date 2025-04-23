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

const cities = [{
    name: 'Amsterdam',
    timezone: 'Europe/Amsterdam',
  },
  {
    name: 'Valencia',
    timezone: 'Europe/Madrid',
  },
  {
    name: 'Paris',
    timezone: 'Europe/Paris',
  },
  {
    name: 'Sydney',
    timezone: 'Australia/Sydney',
  },
  {
    name: 'Berlin',
    timezone: 'Europe/Berlin',
  },
  {
    name: 'Helsinki',
    timezone: 'Europe/Helsinki',
  }
];
// Hier maar ik 6 verschillende steden aan

function getCityWeather(timezone) {
  return new Intl.DateTimeFormat('nl-NL', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date());
}
// Hier haal ik de tijd per stad op

app.get('/', async (req, res) => {
  const allLocationsWeather = [];

  let weatherIcon
  for (const city of cities) {

    const weather = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city.name}&appid=${apiKey}&units=metric`);
    const weatherData = await weather.json();
    const weatherIconId = weatherData.weather[0].icon

    if (weatherIconId) {
      weatherIcon = `https://openweathermap.org/img/wn/${weatherIconId}@2x.png`
    }

    weatherData.time = getCityWeather(city.timezone);
    // Hier haal ik de tijd op van de stad
    weatherData.weather[0].icon = weatherIcon
    // Hier haal ik de icon op van de stad, er staat op 0 omdat het een array is
    allLocationsWeather.push(weatherData);

  }

  return res.send(renderTemplate('server/views/index.liquid', {
    weather: allLocationsWeather
  }));
});



app.get('/:city/', async (req, res) => {

  const city = req.params.city;
  const item = cities.find((item) => item.name === city);

  const options = {
    method: 'GET',
    headers: {
      'x-freepik-api-key': apiKeyFreepik
    }
  };

  const imageFetch = fetch(`https://api.freepik.com/v1/resources?filters[ai-generated][excluded]=1&term=${city}&filters[content_type][photo]=1`, options)
    .then(response => response.json())
    .catch(err => console.error(err));

  const images = await imageFetch;


  const cityImage = await images.data[0].image.source.url;

  const weather = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
  const weatherData = await weather.json()
  const weatherIconId = await weatherData.weather[0].icon

  let weatherIcon

  if (weatherIconId) {
    weatherIcon = `https://openweathermap.org/img/wn/${weatherIconId}@2x.png`
  }


  weatherData.time = getCityWeather(city.timezone);

  console.log(weatherData);


  if (!item) {
    return res.status(404).send('Not found');
  }
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
