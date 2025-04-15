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
const location = 'Lisse';

app
  .use(logger())
  .use('/', sirv('dist'))
  .use('/public', sirv('public'))
  .listen(3000, () => console.log('Server available on http://localhost:3000'));

// async function getWeather() {
//   try {
//     const response = await fetch(url);

//     if (!response.ok) {
//       throw new Error(`HTTP error! Status: ${response.status}`);
//     }

//     const data = await response.json();
//     console.log(data);

//   } catch (error) {
//     console.error("Error fetching weather data:", error);
//   }
// }

// getWeather();


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

function getCityWeather(timezone) {
  return new Intl.DateTimeFormat('nl-NL', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date());
}

app.get('/', async (req, res) => {
  const allLocationsWeather = [];

  for (const city of cities) {

    const weather = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city.name}&appid=${apiKey}&units=metric`);
    const weatherData = await weather.json();
    // getCityWeather(weatherData.timezone);
    // setInterval(() => {
    //   console.log(city.name, getCityWeather(city.timezone));
    // }, 1000)
    // console.log(weatherData, 'weatherData');

    weatherData.time = getCityWeather(city.timezone);
    allLocationsWeather.push(weatherData);
  }

  console.log(allLocationsWeather, 'allLocationsWeather');

  return res.send(renderTemplate('server/views/index.liquid', {
    weather: allLocationsWeather,
  }));
});



app.get('/:city/', async (req, res) => {
  const city = req.params.city;
  const item = cities.find((item) => item.name === city);

  if (!item) {
    return res.status(404).send('Not found');
  }
  return res.send(renderTemplate('server/views/detail.liquid', {
    title: `Detail page for ${city}`,
    item
  }));
});

const renderTemplate = (template, data) => {
  const templateData = {
    NODE_ENV: process.env.NODE_ENV || 'production',
    ...data
  };

  return engine.renderFileSync(template, templateData);
};

// const cities = [{
//     id: 'homeBlok1',
//     name: 'Amsterdam'
//   },
//   {
//     id: 'homeBlok2',
//     name: 'Rotterdam'
//   },
//   {
//     id: 'homeBlok3',
//     name: 'Utrecht'
//   },
//   {
//     id: 'homeBlok4',
//     name: 'Eindhoven'
//   },
//   {
//     id: 'homeBlok5',
//     name: 'Groningen'
//   },
//   {
//     id: 'homeBlok6',
//     name: 'Maastricht'
//   }
// ];



// console.log('Datum en tijd in Amsterdam:', datumTijdInTijdzone('Europe/Amsterdam'));
