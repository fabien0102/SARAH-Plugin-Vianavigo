// # Vianavigo SARAH plugin (by Fabien0102 - 02/01/2014)
//
// Find horaire of the next train in your favorite station
exports.action = function ( data, callback, config, SARAH ) {
  // Module dependencies
  var request = require( "request" );
  var cheerio = require( "cheerio" );

  // Retrieve config
  config = config.modules.vianavigo;

  // Trip informations
  var departure = config.departure;
  var departureCity = config.departureCity;
  var departureCityCode = config.departureCityCode;
  var departureExternalCode = config.departureExternalCode;
  var departureReadable = decodeURI( departure ).replace( /\+/g, " " ).replace( "%2C", "," );

  var arrival = config.arrival;
  var arrivalCity = config.arrivalCity;
  var arrivalCityCode = config.arrivalCityCode;
  var arrivalExternalCode = config.arrivalExternalCode;
  var arrivalReadable = decodeURI( arrival ).replace( /\+/g, " " ).replace( "%2C", "," );

  // Check if all value are defined
  if ( Array.isArray( ( departure + departureCity + departureCityCode + departureExternalCode + arrival + arrivalCity + arrivalCityCode + arrivalExternalCode ).match( "undefined" ) ) ) {
    callback( {
      tts: "Il me manque quelques informations, pouvez-vous vérifier la configuration ?"
    } );
    return;
  }

  // Date formatting
  var now = new Date();

  var hour = now.toTimeString().split( ":" )[ 0 ];
  var min = now.toTimeString().split( ":" )[ 1 ];

  var day = now.getDate();
  var month = now.getMonth() + 1;
  var year = now.getFullYear();

  // Format in 2 digits
  day = ( "0" + day ).slice( -2 );
  month = ( "0" + month ).slice( -2 );

  var date = day + month + year; // ddmmyyyy

  // Create url with trip informations
  var url = "http://m.vianavigo.com/fr/itineraire/?mrq=&id=206&departure=" + departure + "&departureType=StopArea&departureCity=" + departureCity + "&departureCityCode=" + departureCityCode + "&departureExternalCode=" + departureExternalCode + "&arrival=" + arrival + "&arrivalType=StopArea&arrivalCity=" + arrivalCity + "&arrivalCityCode=" + arrivalCityCode + "&arrivalExternalCode=" + arrivalExternalCode + "&walkSpeed=1&date=" + date + "&dateFormat=ddMMyyyy&sens=1&hour=" + hour + "&min=" + min + "&submitSearchItinerary=&spcar=%C3%A2&whereId=0&L=0";

  // Do http request and send this to cheerio for scrapping
  request( url, function ( error, response, body ) {
    if ( error && response.statusCode !== 200 ) {
      callback( {
        tts: "L'action a échoué"
      } );
      console.log( "[vianavigo] " + error );
      return;
    }

    var $ = cheerio.load( body, {
      xmlMode: true,
      ignoreWhitespace: false,
      lowerCaseTags: false
    } );

    // Scraping
    var content = $( ".hourDeparture" ).find( "p" ).text();
    var hours = content.match( /\d+:\d+/g );

    // Calcul left time
    var leftTime = ( hours[ 0 ].split( ":" )[ 0 ] * 60 + hours[ 0 ].split( ":" )[ 1 ] ) - ( hour * 60 + min );

    var tts = "Le prochain train à " + departureReadable + " est dans " + leftTime + " minutes.";
    tts += " Il arrivera à " + arrivalReadable + " à " + hours[ 1 ].replace( ":", " heures " ) + ".";

    // Troll if your are late
    if ( config.trollTime > leftTime ) {
      tts += " Vous ne l'aurez jamais !!!";
    }

    callback( {
      tts: tts
    } );
  } );

};
