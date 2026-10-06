import Alexa from 'ask-sdk-core';
import { ExpressAdapter } from 'ask-sdk-express-adapter';

/**
 * Returns model and propulsion text for natural speech
 */
export function getBusVoiceDescription(vehicleId) {
  if (!vehicleId) return 'un autobús estándar';
  const num = parseInt(vehicleId, 10);

  if (num >= 337 && num <= 352) {
    return 'un Irizar ie Tram eléctrico articulado de cero emisiones';
  }
  if (num >= 353 && num <= 399) {
    return 'un Irizar ie Tram eléctrico';
  }
  if (num >= 400 && num <= 499) {
    return 'un Solaris Urbino híbrido';
  }
  if (num >= 600 && num <= 699) {
    return "un MAN Lion's City de gas natural comprimido";
  }
  if (num >= 700 && num <= 799 || num === 75) {
    return 'un autobús articulado de gran capacidad';
  }
  if (num >= 200 && num <= 299) {
    return 'un Mercedes Citaro de gas natural';
  }
  return 'un autobús urbano de gas natural';
}

/**
 * Normalizes line speech names (e.g. "uno" -> "1", "circular uno" -> "C1", "c dos" -> "C2")
 */
function normalizeLineSlot(rawLine) {
  if (!rawLine) return '';
  const clean = String(rawLine).trim().toLowerCase();
  
  const map = {
    'uno': '1', 'dos': '2', 'tres': '3', 'cuatro': '4', 'cinco': '5',
    'seis': '6', 'siete': '7', 'ocho': '8', 'nueve': '9', 'diez': '10',
    'once': '11', 'doce': '12', 'trece': '13', 'catorce': '14', 'quince': '15',
    'dieciséis': '16', 'diecisiete': '17', 'dieciocho': '18', 'diecinueve': '19',
    'veinte': '20',
    'c uno': 'C1', 'c 1': 'C1', 'circular 1': 'C1', 'circular uno': 'C1',
    'c dos': 'C2', 'c 2': 'C2', 'circular 2': 'C2', 'circular dos': 'C2',
    'h': 'H', 'hache': 'H',
  };

  return map[clean] || clean.toUpperCase();
}

/**
 * Creates the Alexa Skill Handler with Express Adapter
 */
export function createAlexaSkill({ getStopArrivals, getStopByCode, searchStopsByName, getAlerts, getLines }) {
  
  // 1. Launch Request
  const LaunchRequestHandler = {
    canHandle(handlerInput) {
      return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
      const speechText = '¡Bienvenido a VallaBus de AUVASA Valladolid! Puedes preguntarme: ¿Cuándo pasa el autobús en la parada cincuenta y ocho?, o ¿Cuánto falta para la línea uno en Plaza Poniente? ¿Qué deseas consultar?';
      const repromptText = 'Puedes decirme el número de una parada, por ejemplo: parada 58, o consultar una línea concreta.';

      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(repromptText)
        .withSimpleCard('VallaBus Valladolid', 'Pregunta por una parada o línea de AUVASA.')
        .getResponse();
    },
  };

  // 2. Get Stop Arrivals Intent (e.g. "cuándo pasa el bus en la parada 58", "tiempos en Plaza Poniente")
  const GetStopArrivalsIntentHandler = {
    canHandle(handlerInput) {
      return (
        Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
        Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetStopArrivalsIntent'
      );
    },
    async handle(handlerInput) {
      const { requestEnvelope } = handlerInput;
      const slots = requestEnvelope.request.intent.slots || {};
      
      const stopNumberSlot = slots.StopNumber?.value;
      const stopNameSlot = slots.StopName?.value;

      let targetStopCode = null;
      let stopObj = null;

      if (stopNumberSlot) {
        targetStopCode = String(stopNumberSlot).trim();
        stopObj = getStopByCode(targetStopCode);
      } else if (stopNameSlot) {
        const found = searchStopsByName(stopNameSlot);
        if (found && found.length > 0) {
          stopObj = found[0];
          targetStopCode = stopObj.code;
        }
      }

      if (!targetStopCode || !stopObj) {
        const speech = 'No he encontrado esa parada de AUVASA. Por favor, indícame el número de parada que aparece en el poste o marquesina, por ejemplo parada 58.';
        return handlerInput.responseBuilder.speak(speech).reprompt('¿Qué número de parada quieres consultar?').getResponse();
      }

      const arrivalsData = await getStopArrivals(targetStopCode);
      if (!arrivalsData || !arrivalsData.arrivals || arrivalsData.arrivals.length === 0) {
        const speech = `En la parada ${stopObj.code}, ${stopObj.name}, no hay ningún paso de autobús previsto en los próximos minutos.`;
        return handlerInput.responseBuilder.speak(speech).getResponse();
      }

      // Group arrivals by line to produce natural speech without repetition
      const arrivalsByLine = new Map();
      for (const arr of arrivalsData.arrivals) {
        const key = `${arr.routeShortName}_${arr.destination}`;
        if (!arrivalsByLine.has(key)) {
          arrivalsByLine.set(key, []);
        }
        arrivalsByLine.get(key).push(arr);
      }

      const spokenParts = [];
      for (const [key, list] of Array.from(arrivalsByLine.entries()).slice(0, 3)) {
        const first = list[0];
        const firstTime = first.minutesRemaining <= 0 ? 'está llegando ahora mismo' : `llegará en ${first.minutesRemaining} ${first.minutesRemaining === 1 ? 'minuto' : 'minutos'}`;
        const fleetText = first.isRealtime && first.vehicleId ? ` (${getBusVoiceDescription(first.vehicleId)})` : '';
        
        let part = `La línea ${first.routeShortName} hacia ${first.destination} ${firstTime}${fleetText}`;
        if (list.length > 1) {
          const second = list[1];
          part += `, y el siguiente en ${second.minutesRemaining} minutos`;
        }
        spokenParts.push(part);
      }

      const speech = `En la parada ${stopObj.code}, ${stopObj.name}: ${spokenParts.join('. ')}.`;
      const cardTitle = `Parada #${stopObj.code} - ${stopObj.name}`;
      const cardContent = arrivalsData.arrivals.slice(0, 5).map(a => `• L${a.routeShortName} -> ${a.destination}: ${a.minutesRemaining} min (${a.exactTime})`).join('\n');

      return handlerInput.responseBuilder
        .speak(speech)
        .withSimpleCard(cardTitle, cardContent)
        .getResponse();
    },
  };

  // 3. Get Line at Stop Intent (e.g. "cuándo pasa la línea 1 en Plaza Poniente", "línea C2 en la parada 15")
  const GetLineAtStopIntentHandler = {
    canHandle(handlerInput) {
      return (
        Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
        Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetLineAtStopIntent'
      );
    },
    async handle(handlerInput) {
      const { requestEnvelope } = handlerInput;
      const slots = requestEnvelope.request.intent.slots || {};

      const rawLine = slots.LineNumber?.value;
      const lineName = normalizeLineSlot(rawLine);
      const stopNumberSlot = slots.StopNumber?.value;
      const stopNameSlot = slots.StopName?.value;

      let targetStopCode = null;
      let stopObj = null;

      if (stopNumberSlot) {
        targetStopCode = String(stopNumberSlot).trim();
        stopObj = getStopByCode(targetStopCode);
      } else if (stopNameSlot) {
        const found = searchStopsByName(stopNameSlot);
        if (found && found.length > 0) {
          stopObj = found.find(s => s.routes?.includes(lineName)) || found[0];
          targetStopCode = stopObj.code;
        }
      }

      if (!targetStopCode || !stopObj) {
        const speech = `Por favor, dime el número de parada para consultar la línea ${lineName || 'que buscas'}. Por ejemplo: parada 550.`;
        return handlerInput.responseBuilder.speak(speech).reprompt('¿En qué parada quieres consultar?').getResponse();
      }

      // Check if line passes through this stop
      if (stopObj.routes && stopObj.routes.length > 0 && !stopObj.routes.some(r => r.toUpperCase() === lineName.toUpperCase())) {
        const availableLines = stopObj.routes.join(', ');
        const speech = `La línea ${lineName} no tiene parada en la ${stopObj.code} (${stopObj.name}). Las líneas que pasan por esta parada son: línea ${availableLines}.`;
        return handlerInput.responseBuilder.speak(speech).getResponse();
      }

      const arrivalsData = await getStopArrivals(targetStopCode);
      const lineArrivals = (arrivalsData?.arrivals || []).filter(
        a => a.routeShortName.toUpperCase() === lineName.toUpperCase()
      );

      if (lineArrivals.length === 0) {
        const speech = `No hay ningún autobús de la línea ${lineName} previsto próximamente en la parada ${stopObj.code}, ${stopObj.name}.`;
        return handlerInput.responseBuilder.speak(speech).getResponse();
      }

      const first = lineArrivals[0];
      const second = lineArrivals[1];

      let speech = `El próximo autobús de la línea ${lineName} hacia ${first.destination} `;
      speech += first.minutesRemaining <= 0 ? 'está llegando a la parada' : `llegará en ${first.minutesRemaining} minutos`;

      if (first.vehicleId) {
        speech += `, y es ${getBusVoiceDescription(first.vehicleId)}`;
      }

      if (second) {
        speech += `. El siguiente pasará en ${second.minutesRemaining} minutos.`;
      } else {
        speech += '.';
      }

      return handlerInput.responseBuilder
        .speak(speech)
        .withSimpleCard(`Línea ${lineName} en parada #${stopObj.code}`, speech)
        .getResponse();
    },
  };

  // 4. Service Alerts Intent (e.g. "¿Hay avisos o cortes de AUVASA?")
  const GetAlertsIntentHandler = {
    canHandle(handlerInput) {
      return (
        Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
        Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetAlertsIntent'
      );
    },
    async handle(handlerInput) {
      const alerts = await getAlerts();
      if (!alerts || alerts.length === 0) {
        const speech = 'En este momento no hay avisos de incidencias ni desvíos activos en la red de AUVASA. El servicio funciona con normalidad.';
        return handlerInput.responseBuilder.speak(speech).getResponse();
      }

      const summary = alerts.slice(0, 2).map(a => a.header).join('. ');
      const speech = `AUVASA informa de ${alerts.length} aviso activo: ${summary}`;

      return handlerInput.responseBuilder
        .speak(speech)
        .withSimpleCard('Avisos de AUVASA', alerts.map(a => `• ${a.header}\n${a.description}`).join('\n\n'))
        .getResponse();
    },
  };

  // 5. Help Intent
  const HelpIntentHandler = {
    canHandle(handlerInput) {
      return (
        Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
        Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent'
      );
    },
    handle(handlerInput) {
      const speechText = 'Puedes pedirme los tiempos de llegada diciendo: parada 58, o cuándo pasa la línea 1 en Plaza Poniente. También puedes preguntar si hay avisos de servicio en AUVASA. ¿Qué deseas consultar?';
      return handlerInput.responseBuilder.speak(speechText).reprompt(speechText).getResponse();
    },
  };

  // 6. Cancel & Stop Intent
  const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
      return (
        Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
        (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent' ||
          Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent')
      );
    },
    handle(handlerInput) {
      return handlerInput.responseBuilder.speak('¡Buen viaje con AUVASA! Hasta pronto.').getResponse();
    },
  };

  // 7. Fallback Intent
  const FallbackIntentHandler = {
    canHandle(handlerInput) {
      return (
        Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
        Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent'
      );
    },
    handle(handlerInput) {
      const speechText = 'No he entendido esa consulta de autobús. Puedes decir por ejemplo: ¿Cuándo pasa el autobús por la parada 58?';
      return handlerInput.responseBuilder.speak(speechText).reprompt(speechText).getResponse();
    },
  };

  // 8. Session Ended Request
  const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
      return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
      return handlerInput.responseBuilder.getResponse();
    },
  };

  // 9. Error Handler
  const ErrorHandler = {
    canHandle() {
      return true;
    },
    handle(handlerInput, error) {
      console.error(`[Alexa Error] ${error.message}`);
      return handlerInput.responseBuilder
        .speak('Ha ocurrido un error al conectar con el servicio en tiempo real de AUVASA. Por favor, inténtalo de nuevo en unos momentos.')
        .getResponse();
    },
  };

  const skill = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
      LaunchRequestHandler,
      GetStopArrivalsIntentHandler,
      GetLineAtStopIntentHandler,
      GetAlertsIntentHandler,
      HelpIntentHandler,
      CancelAndStopIntentHandler,
      FallbackIntentHandler,
      SessionEndedRequestHandler
    )
    .addErrorHandlers(ErrorHandler)
    .create();

  const handler = async (req, res) => {
    try {
      const response = await skill.invoke(req.body);
      return res.json(response);
    } catch (err) {
      console.error('[Alexa Handler Error]', err);
      return res.status(500).json({ error: err.message });
    }
  };

  return { skill, handler };
}

