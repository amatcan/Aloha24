var networkState;
var watchId;
var onLine;
var hayRed = false;
var hayGeo = false;
var monitorizarRepartidor = true;
var $j = jQuery.noConflict();

//jQuery.mobile.ajaxEnabled=false;
jQuery.mobile.loadingMessage=false;
/*************************************************************
UTILERIA
*************************************************************/


/**
Inicializa el entorno de ejecución de la aplicación. Sin la llamada a esta funcion en el OnDeviceReady se pueden obtener resultados
incoherentes en la ejecución de la aplicación.
*/
function inicializacionEntorno(){
    
	onLine = window.localStorage.getItem(ONLINE)==undefined?true:window.localStorage.getItem(ONLINE);
	hayRed = window.localStorage.getItem(HAY_RED)==undefined?checkConnection():window.localStorage.getItem(HAY_RED);
	hayGeo = window.localStorage.getItem(HAY_GEO)==undefined?false:window.localStorage.getItem(HAY_GEO);
	$j(".ui-loader").attr('style','display:none');
	check();
	inicializaPosicionamiento();
	setInterval(check, POOL_TIMEOUT);	
}
/**
Chequea el estado de la conectividad de datos del dispositivo y actualiza la variable global hayRed para indicar esta situación.
*/
var contaconta = 0;
function checkConnection() {
	if (navigator.connection != undefined){
		networkState = navigator.connection.type;
		var states = {};
		states[Connection.UNKNOWN]  = 'Unknown connection';
		states[Connection.ETHERNET] = 'Ethernet connection';
		states[Connection.WIFI]     = 'WiFi connection';
		states[Connection.CELL_2G]  = 'Cell 2G connection';
		states[Connection.CELL_3G]  = 'Cell 3G connection';
		states[Connection.CELL_4G]  = 'Cell 4G connection';
		states[Connection.CELL]     = 'Cell generic connection';
		states[Connection.NONE]     = 'No network connection';
		hayRed = networkState != Connection.NONE;
		window.localStorage.setItem(HAY_RED, hayRed);
		return hayRed;
	}
	if (navigator.onLine != undefined && navigator.onLine == true)
	    hayRed = true;
	else
	    hayRed = false;
	
	window.localStorage.setItem(HAY_RED, hayRed);
	return hayRed;
}
//comprueba es estado del dispositivo
function check(){
	//console.log("Testeando dispositivo...");
	checkConnection();
	actualizaNotificaciones();
	//Si hay red se sincronizan los datos
	if (hayRed){
	    tarea = getTarea();
	    if (tarea != undefined){
	        if (tarea.ts != undefined){
	            sincronizarTarea();
	        }
	    }
	}

	//console.log('RED: '+hayRed);
	estadoAnterior = hayGeo;
	
}

/**
Obtiene el nombre de la imagen que referencia el modo de pago
@param modo Modo de pago
@result Imagen representativa
*/
function getImagenPago(modo){
	img = 'images/';
	switch (modo){
		case MODO_PAGO_METALICO: 
			img += 'metalico.png';
			break;
		case MODO_PAGO_METALICO: 
			img += 'metalico.png';
			break;
		default:
			img += 'metalico.png';
	}
	return img;
}

/**
Cierre de la aplicación
*/
function exitApp(){
	if (confirm("Va a cerrar la aplicacion.")){
		if (navigator.app){
		   navigator.app.exitApp();
		}
		else if (navigator.device) {
			navigator.device.exitApp();
		}else{
		    app.exitApp();
		}
	}
}

function enviarCambios(){
	cambios = getCambios();
	if (cambios == undefined || cambios == null)
		return;
	if (hayRed){
	    console.log("Enviando cambios....");
	    token=getToken();
	    if (token == undefined)
	        return RETURN_CODE_ERROR;	    
	    cambios.token = token;
		json = fpost(URL_SUBIR_CAMBIOS, cambios);
		if (json.code == -1){
            muestraMensaje("Se ha producido un error en el servidor.");
            return RETURN_CODE_ERROR;
        }else{
            if (json.code >= RETURN_CODE_OK){
                removeCambios();
                if (json.code == RETURN_CODE_OK){                    
                    tarea = getTarea(tarea);                    
                    if (tarea != undefined){
                        removeTareaTS();
                        setTarea(tarea);
                        return RETURN_CODE_OK;
                    }else{
                        muestraMensaje("Error interno de la aplicación: Tarea no disponible.");
                        return RETURN_CODE_ERROR
                    }
                }else{
                    if (json.code == RETURN_CODE_UPDATE){
                        tarea = parseaTarea(json);
                        muestraMensaje("Su tarea ha sido actualizada por la central. Por favor, compruebe la.");
                        setTarea(tarea);
                        return RETURN_CODE_UPDATE;
                    }
                }
            }
        }
		
	}
	return RETURN_CODE_OK;
}
/**
Se encarga de sincronizar los datos de la tarea con el servidor por si este ha estado trabajando
de forma sin conexión.
*/
function sincronizarTarea(){
	if (hayRed){
		tarea = getTarea();
		if (tarea == undefined)
			return;
		//Si no se modificó la tarea, no se sincroniza. Pero se consulta si hay cambios en la tarea
		if (tarea.ts == undefined){
			//consultaCambiosEnTarea();
			return;
		}else{
			enviarCambios();
		}
	}
}
function okSincronizacion(json){
	alert("OKsincronizacion....");
}
function errorSincronizacion(XMLHttpRequest, textStatus, errorThrown){
	alert("OKsincronizacion....");
}
//Prototipo para sacar un parametros de la querystring por su nombre
$j.getParamFromUrl = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
       return null;
    }
    else{
       return results[1] || 0;
    }
}
/**
Genera un string que representa la hora de la fecha pasada.
@param dateTime objeto fecha
@return String con la hora que contiene la fecha.
*/
function getTimeFromDateTimeString(dateTime){
	d = new Date(dateTime);
	return d.getHours() + ":" + d.getMinutes();
}
/**
Obtiene un string con el timestamp actual en segundos
@return String con los milisegundos del timestamp actual
*/
function getTS(){
	d = new Date();
	return Math.round(d.getTime()/1000);
}
/**
Marca la tarea con un timestamp indicado
@param ts Timestamp con el que marcar la tarea, si no se indica se calcula en el momento
*/
function setTareaTS(tarea, ts){
	if (ts == undefined)
		ts = getTS();
	if (tarea == undefined)
	    tarea = getTarea();
	if (tarea == undefined)
	    return;
	tarea.ts = ts;
	return tarea;
}
function removeTareaTS(tarea){
    if (tarea == undefined)
        tarea = getTarea();
    if (tarea == undefined)
        return;
    tarea.ts = undefined;
}
function gpost(url,f){
    jQuery.getJSON(url+'?callback=?').done(function(json){
        console.log("1:"+json);
        f(json);
    }).fail(function() {
        console.log( "error" );
    }).always(function() {
        console.log( "complete" );
    });
    return false;
}

/**
Realiza una petición POST a la url pasando los parametros indicados. Cuando finaliza la petición ejecuta la función f.
@param url Url a la que hacer la peticióname
@param data Parametrización de la consulta en formato json
@param f Función que se ejecutará después de finalizar la petición y si esta petición a sido correcta.
@param ferror Función que se ejecutará después de finalizar la petición en caso de que se produzca un error
@return el json con la respuesta.
*/
function fpost(url, data, f, ferror){
    console.log(url);
	resultado = {};
	try{
		jQuery.support.cors = true;
		jQuery.ajaxSetup({ cache:false });
		jQuery.mobile.allowCrossDomainPages = true;
		jQuery.ajax({
			type: 'POST',
			url: url,                   
			dataType: 'json',
			async:false,
			timeout: 30000,
			cache:false,
			data : data == undefined?{}:{datos:JSON.stringify(data)}, 
			success: function(json){
					console.log(json);
					if (f != undefined && f != null)
						resultado = f(json.resultado);
					else
						resultado = json.resultado;
				 },
			error:function(xhr, textStatus, errorThrown) {
				if (ferror != undefined)
					ferror('Se ha producido un error en la comunicacion con el servidor. Intentelo de nuevo y si el problema persiste pongase en contacto con la central.',XMLHttpRequest, textStatus, errorThrown);
				else
					alert('Error al consultar :: ' + xhr.status + " :: " +textStatus + " :: " + errorThrown);
			 }
		});
		return resultado;
	}catch(err){
		return resultado;
	}
}
/**
Realiza una petición GET a la url pasando los parametros indicados. Cuando finaliza la petición ejecuta la función f.
@param url Url a la que hacer la peticióname
@param f Función que se ejecutará después de finalizar la petición y si esta petición a sido correcta, opcional
@param ferror Función que se ejecutará después de finalizar la petición en caso de que se produzca un error, opcional
@return JSON con la devolución de la petición
*/
function fget(url, f, ferror){
    console.log("GET:"+url);
	resultado = {};
	try{
	    jQuery.support.cors = true;
        jQuery.ajaxSetup({ cache:false });
        jQuery.mobile.allowCrossDomainPages = true;
		jQuery.ajax({
			type: 'GET',
			url: url,                   
			dataType: 'json',
			async:false,
			timeout: 30000,
			cache:false,
			success: function(json){
				console.log(json);
				if (f != undefined && f != null)
					resultado = f(json.resultado);
				else
					resultado = json.resultado;
			 },
			 error:function(XMLHttpRequest, textStatus, errorThrown) {
				if (ferror != undefined)
					ferror('Se ha producido un error en la comunicacion con el servidor. Intentelo de nuevo y si el problema persiste pongase en contacto con la central.',XMLHttpRequest, textStatus, errorThrown);
				else
					alert('Error al consultar :: '+ typeof(XMLHttpRequest) + " :: " + XMLHttpRequest + " :: " +textStatus + " :: " + errorThrown);
			 }
		});
		return resultado;
	}catch(err){
		return resultado;
	}
}
/**
 * Obtiene el contenido de una url
 * @param url
 * @returns
 */
function getJSONFromUrl(url){                
    jQuery.support.cors = true;
    jQuery.ajaxSetup({ cache:false });
    jQuery.mobile.allowCrossDomainPages = true;
    $j.ajax({
        type: 'GET',
        url: url,                   
        dataType: 'json',
        async:false,
        timeout: 30000,
        cache:false,
        success: function(json){
            return json;
        },
        error:function(XMLHttpRequest, textStatus, errorThrown) {
            alert('Error al consultar :: '+ typeof(XMLHttpRequest) + " :: " + XMLHttpRequest + " :: " +textStatus + " :: " + errorThrown);
            result =  null;
        }
    });
    return {};
    
}

/**
Función generica para mostrar un mensaje de petición enviada con éxito.
@param msg Mensaje a  mostrar.
*/
function genericaOK(msg){
	alert(msg);
	return true;
}
/**
Función generica para mostrar un mensaje de petición enviada que generó un error.
@param msg Mensaje a  mostrar.
*/
function genericaError(msg,XMLHttpRequest, textStatus, errorThrown){
	alert(msg + '\n' + XMLHttpRequest + '\n' +textStatus + '\n' + errorThrown);
	return false;
}
function sendPeticion(url, data, f){
	if (hayRed){
		fpost(url, data, f);
	}else{
	
	}
}
/**
 * Muestra el loader
 */
function pushLoader(){ 
    $j('.loader').show('fast');
}
/**
 * Esconde el loader
 */
function removeLoader(){ 
    $j('.loader').hide('fast');
}

/**
 * Espera unos milesegundos antes de continuar
 * @param millis
 */
function wait(millis)
{
    var date = new Date();
    var curDate = null;    
    do{curDate = new Date();}
    while(curDate-date < millis);
} 
/**
Implementa el proceso de login en la plataforma. En este caso:
1: solicita validación de credenciales
2: guarda las tareas del repartidos en el localStorage
3: redirecciona a la página adecuada.
Cuando se produce un acceso, y hay cambios almacenados de una sesión anterior, se envían y se tiene que actualizar la tarea que llega
con respecto a los cambios que se envían.
Si se produce un error, ejecuta la función indicada----por implementar
*/
function checkLogin(usr, pwd){
    if (!hayRed)
        return RETURN_CODE_ERROR_SIN_RED;
    url = URL_LOGIN;
    data = {'username':usr,'password':pwd};
    json = fpost(url, data);
    if (json.code == 0){
        removeTarea();
		setToken(json.token);
		setNombre(json.nombre);
		tarea = json;
		cambios = getCambios();
		if (cambios != undefined && cambios.cambios.length > 0){
		    //antes de enviar los cambios se quitan de la tarea los pedidos cerrados
		    for (i = 0;i<cambios.cambios.length;i++){
		        cambio = cambios.cambios[i];
		        if (cambio.est == PEDIDO_ESTADO_CERRADO){
		            removePedido(cambio.idPed, tarea);
		        }
		    }
		    //si hay cambios pendientes, se envían
		    enviarCambios();
		    //se actualiza la tarea con el ultimo cambio
		    lastCambio = cambios.cambios[cambios.cambios.length-1];
		    tarea = setTarea(json);		    
		    pos = getPosicionPedidoPorId(lastCambio.idPed, tarea);
		    if (pos != -1){
		        tarea.pedidos[pos].pedido.estado = lastCambio.est;
		        tarea.pedidos[pos].pedido.negocioActual = lastCambio.idNeg;
		    }
		}
		
		tarea = parseaTarea(tarea);
		setTarea(tarea);
		pedidoActual = getPedidoActual();
		//Para ir a un pedido directamente, además de existir su estado no puede ser ASIGNADO
		if (pedidoActual != undefined && pedidoActual != null && pedidoActual.pedido.estado != PEDIDO_ESTADO_ASIGNADO){
			return RETURN_CODE_OK_PEDIDO_EN_CURSO;
		}
		else
		    return RETURN_CODE_OK_NO_PEDIDO_EN_CURSO;			
    }
    return RETURN_CODE_LOGIN_ERROR;
}

/**
Borra el html contenido en un elemento
@param id Identificador del elemento a borrar su contenido
*/
function borraHtml(id){
	linea = $j('#'+id);
	//En el caso de que exista, borra su contenido
	if (linea != undefined && linea != null){
		linea.html('');
	}
}

/**
Muestra un mensaje.
@param msg Mensaje a utilizar.
*/
function muestraMensaje(msg){
	alert("AlohaMov\n"+msg);
}
/*************************************************************
GESTION LOCALSTORAGE
*************************************************************/
/**
Obtiene la tarea a desempeñar
@return Objeto JSON con la tarea asignada
*/
function getTarea(){
	tarea = window.localStorage.getItem(TAREA);
	if (tarea == undefined || tarea == null)
		return {};
	tarea = JSON.parse(tarea);
	return tarea;
}
/**
Guarda la tarea
@param JSON con la tarea
*/
function setTarea(tarea){
	if (tarea == undefined || tarea == null)
		return;
	window.localStorage.setItem(TAREA,JSON.stringify(tarea));
	return tarea;
}

/**
 * Borra la tarea
 */
function removeTarea(){
    window.localStorage.removeItem(TAREA);
}
/**
Guarda la posición
@param JSON con la posición
*/
function setPosicion(posicion){
    if (posicion == undefined || posicion == null)
        return;
    window.localStorage.setItem(POSICION,JSON.stringify(posicion));
}
/**
Recupera la última posición
@param JSON con la posición
*/
function getPosicion(){
    posicion = window.localStorage.getItem(POSICION);
    if (posicion == undefined || posicion == null)
        return {};
    posicion = JSON.parse(posicion);
    return posicion;
}
/**
Obtiene el token intercambiado con el servidor.
@return token de seguridad
*/
function getToken(){
    token = "XXXXXXX";
    try{
    	token = window.localStorage.getItem(TOKEN);
    	if (token == undefined || token == null)
    		return '';
    }catch(err){
        console.log(err);
    }
	return token;
}
/**
Guarda el token intercambiado con el servidor.
@param String con el token de seguridad
*/
function setToken(str){
    token = "XXXXXXX";
    try{    
    	if (str == undefined || str == null)
    		return;
    	token = window.localStorage.setItem(TOKEN, str);
    }catch(err){
        console.log(err);
    }
    return token;
}
/**
Obtiene el nombre real del usuario
@return Nombre del usuario
*/
function getNombre(){
    nombre = window.localStorage.getItem(NOMBRE);
    if (nombre == undefined || nombre == null)
        return '';
    return nombre;
}
/**
Guarda el nombre del usuario
@param String con el nombre de usuario
*/
function setNombre(str){
    if (str == undefined || str == null)
        return;
    window.localStorage.setItem(NOMBRE, str);
}
/**
Obtiene el array de cambios que se han producido y que hay que sincronizar
@return Objeto JSON con los cambios
*/
function getCambios(){
	cambios = window.localStorage.getItem(CAMBIOS);
	if (cambios == undefined || cambios == null){
		cambios = {"cambios":[]};
		window.localStorage.setItem(CAMBIOS, JSON.stringify(cambios));
    }else{
        cambios = JSON.parse(cambios); 
    }
	
	return cambios;
}
/**
 * Borra los cambios almacenados
 */
function removeCambios(){
    window.localStorage.removeItem(CAMBIOS);
}
/**
Añade un cambio para su posterior sincronización
@param idPed Id del pedido modificado, obligatorio
@param estado Estado al que pasa el pedido, obligatorio
@param idNego Id del negocio modificado, es opcional
@ts timestamp, opcional
*/
function addCambio(idPed, estado, idNeg, ts){
	if (ts == null || ts == undefined)
		ts = getTS();
	if (idPed == null || idPed == undefined)
		return;
	if (idNeg == null || idNeg == undefined)
		idNeg = -1;
	cambios = getCambios();
	console.log(JSON.stringify(cambios));
	cambios.cambios.push({"idPed":parseInt(idPed),"est":parseInt(estado),"idNeg":parseInt(idNeg),"ts":ts});
	window.localStorage.setItem(CAMBIOS, JSON.stringify(cambios));
	tarea = setTareaTS();
	setTarea(tarea);
}

/*************************************************************
TAREA
*************************************************************/
/**
 * Realiza un parse de la tarea que se recibe desde el servidor para poder utilzarla directamente desde el interface. ES decir, 
 * añade los estados necesarios.
 * param @tarea json con la tarea a parsear
 * return json con la tarea parseada.
 */
function parseaTarea(tarea){    
    if (tarea == null)
        return null;
    
    //Como solo puede llegar el primer pedido con estados, se omiten el resto
    if (tarea.pedidos == undefined || tarea.pedidos.length == 0)
        return tarea;
    
          
     negocioActual = getNegocioActualFromResponse(tarea);
    //si hay negocio actual, o se va al cliente, se ponen todos los anteriores (si hay) en recogidos
    if (negocioActual == null)
        return tarea;
    
    posicion = 0;
    if (tarea.pedidos[0].pedido.estado == PEDIDO_ESTADO_EN_ENTREGA || tarea.pedidos[0].pedido.estado == PEDIDO_ESTADO_ENTREGANDO){
        posicion = tarea.pedidos[0].pedido.negocios.length;
        tarea.pedidos[0].pedido.empaquetado = PEDIDO_PAQUETE_COMPLETO;
    }else{
        if (tarea.pedidos[0].pedido.estado == PEDIDO_ESTADO_ASIGNADO){
            posicion = 0;
        }else{
            if (negocioActual == -1){
                posicion = 0;
            }else{
                posicion = negocioActual.posicion;
                tarea.pedidos[0].pedido.negocios[negocioActual.posicion].estado = tarea.pedidos[0].pedido.estado;
            }
        }
    }
    for(i=0;i<posicion;i++){
        tarea.pedidos[0].pedido.negocios[i].estado = PEDIDO_NEGOCIO_ESTADO_RECOGIDO;
    }
    return tarea;
}
/*************************************************************
PEDIDOS
*************************************************************/
/*
El pedido que tengan la clase primero-disponible, presenta una confirmación para iniciarlo. Si no se acepta, solo
se ven los datos.
*/
function ponerPedidoEnCurso(idPedido){
	code = setPedidoEnCurso(idPedido);
	if (code == RETURN_CODE_OK || code == RETURN_CODE_OK_SIN_RED){
		return true;
	}						
	return false;
}
/**
Pone un pedido en curso (transito)
@param id Identificador del pedido
*/
function setPedidoEnCurso(id){
    tarea = getTarea();
    if (tarea == undefined)
        return;
    pedido = getPedidoPorId(id, tarea);
	//url = URL_PEDIDO_GESTION+'?'+PAR_PEDIDO_ID+'='+id+'&'+PAR_ESTADO+'='+PEDIDO_NEGOCIO_ESTADO_EN_TRANSITO;
    url = URL_PEDIDO_GESTION;
	code = peticionCambioEstadoPedido(url, id, PEDIDO_NEGOCIO_ESTADO_EN_TRANSITO, pedido.pedido.negocios[0].id);
	
	switch(code){
		case RETURN_CODE_OK:
			tarea = getTarea();
			tarea.pedidoActual = id;
			setTarea(tarea);
			break;
		case RETURN_CODE_OK_SIN_RED:
			//actualizar interface
			break;
	}

	return code;
}

/**
 * Borra un pedido de la tarea del repartidor
 * @param id Id del pedido a borrar
 */
function removePedido(id, tarea){
    guardarTarea = false;
    if (tarea == undefined){
        guardarTarea = true;
        tarea = getTarea();
        if (tarea == undefined)
            return;
    }
    pos = getPosicionPedidoPorId(id, tarea);
    if (pos == -1)
        return;
    tarea.pedidos.splice(pos, 1);
    if (guardarTarea)
        setTarea(tarea);
}
/**
Realiza una petición para actualizar el estado de un pedido.
@param url URL contra la que hacer la petición
@param idPed Id del pedido a actualizar
@param estado Estado al que pasa el pedido
@param idNeg Id del negocio al que afecta el cambio de estado, no es obligatorio
@return 
RETURN_CODE_ERROR_SIN_RED si se produce un error y no hay red.
RETURN_CODE_ERROR si se produce un error y hay red
RETURN_CODE_OK todo fue bien
RETURN_CODE_UPDATE todo fue bien, pero la central ha actualizado la tarea del repartidor
RETURN_CODE_OK_SIN_RED todo fue bien y no hay red
*/
function peticionCambioEstadoPedido(url, idPed, estado, idNeg){
	if (hayRed){
		token = getToken();
		//falta verificar si hay pars anteriores
		//url += '&'+PAR_TOKEN+'='+token;
		if (idNeg == null){
		    idNeg = ID_CLIENTE;
		}
		data = {"idPed":idPed,"est":estado,"idNeg":idNeg,"token":token,"ts":+getTS()};
		//json = fget(url,null, genericaError);
		json = fpost(url,data);
		if (json.code != undefined){
			if (json.code == -1){
				muestraMensaje("Se ha producido un error en el servidor.");
				return RETURN_CODE_ERROR;
			}else{
				if (json.code == RETURN_CODE_OK){
					tarea = getTarea();
					if (tarea != undefined){
						pos = getPosicionPedidoPorId(idPed,tarea);
						if (pos == -1){
							muestraMensaje("Error. Pedido no localizado.");
							return RETURN_CODE_ERROR;
						}
						tarea.pedidos[pos].pedido.estado = estado;
						//Marca el pedido
						setTarea(tarea);
						return RETURN_CODE_OK;
					}else{
						muestraMensaje("Error interno de la aplicación: Tarea no disponible.");
						return RETURN_CODE_ERROR
					}
				}else{
					if (json.code == RETURN_CODE_UPDATE){
					    tarea = parseaTarea(json);
						muestraMensaje("Su tarea ha sido actualizada por la central. Por favor, compruebe la.");
						setTarea(tarea);
						return RETURN_CODE_UPDATE;
					}
				}
			}
		}
	}else{
		tarea = getTarea();
		if (tarea != undefined){
			pos = getPosicionPedidoPorId(idPed,tarea);
			if (pos == -1)
				return;			
			addCambio(idPed,estado);
			tarea.pedidos[pos].pedido.estado = estado;
			setTarea(tarea);
			return RETURN_CODE_OK_SIN_RED;
		}else
			return RETURN_CODE_ERROR_SIN_RED;
	}
	return RETURN_CODE_ERROR;
}
/**
Confirma la entrega de un pedido. De este modo, el pedido queda completado.
@param id Identificador del pedido
@return -1 si hay error, 0 si todo fue bien y 1 si se ha producido una actualización desde la central.
*/
function setPedidoEntregado(id){
	//url = URL_PEDIDO_GESTION+'?'+PAR_PEDIDO_ID+'='+id+'&'+PAR_ESTADO+'='+PEDIDO_ESTADO_CERRADO;
	url = URL_PEDIDO_GESTION;
	return peticionCambioEstadoPedido(url, id, PEDIDO_ESTADO_CERRADO, ID_CLIENTE);
}
/**
Confirma que el pedido ha llegado al cliente y se procederá a su entrega.
@param id Identificador del pedido
@param token token de seguridad
@return -1 si hay error, 0 si todo fue bien y 1 si se ha producido una actualización desde la central.
*/
function setPedidoEnCliente(id){
	//url = URL_PEDIDO_GESTION+'?'+PAR_PEDIDO_ID+'='+id+'&'+PAR_ESTADO+'='+PEDIDO_ESTADO_ENTREGANDO;
    url = URL_PEDIDO_GESTION;
	return peticionCambioEstadoPedido(url, id, PEDIDO_ESTADO_ENTREGANDO, ID_CLIENTE);
}
/**
Obtiene el pedido actual en el que está trabajando.
@param tarea json de la tarea encomendada
@return json con el pedido actual, null en caso de no tenerlo.
*/
function getPedidoActual(tarea){
    tarea = getTarea();
    if (tarea != undefined && tarea.pedidos.length > 0){
        //si solo está asignado, no está en transito
        if (tarea.pedidos[0].pedido.estado == undefined || tarea.pedidos[0].pedido.estado == null || tarea.pedidos[0].pedido.estado == PEDIDO_ESTADO_SIN_ASIGNAR || tarea.pedidos[0].pedido.estado == PEDIDO_ESTADO_ASIGNADO || tarea.pedidos[0].pedido.estado == PEDIDO_ESTADO_CERRADO)
            return null;
        pedidoActual = tarea.pedidos[0].pedido.id; 
        return getPedidoPorId(pedidoActual, tarea);
    }else{
        return null;
    }
}
/**
Obtiene un pedido de la tarea por su id
@param id Identificador del pedido
@param tarea json de la tarea encomendada, opcional
@return json con el pedido, null si no existe
*/
function getPedidoPorId(id, tarea){
	if (id != undefined && id != null){
	    if (tarea == undefined){
	        tarea = getTarea();
	        if (tarea == undefined)
	            return null;
	    }
		for(i=0;i<tarea.pedidos.length;i++){
			if (tarea.pedidos[i].pedido.id == id)
				return tarea.pedidos[i];
		}
	}
	return null;
}
/**
Obtiene la posición que tiene el pedido dentro de la tarea.
@param id Identificador del pedido
@param tarea json de la tarea encomendada
@return posición en el array de pedidos, -1 si no existe
*/
function getPosicionPedidoPorId(id, tarea){
    if (tarea == undefined)
        tarea = getTarea();
	if (id != undefined && id != null){
		for(i=0;i<tarea.pedidos.length;i++){
			if (tarea.pedidos[i].pedido.id == id)
				return i;
		}
	}
	return -1;
}
function inicializaInterfaze(tarea){
	actualizaFuncionalidadMenu();
	actualizaNotificaciones(tarea);
}
function actualizaFuncionalidadMenu(){
	$j('#M-ONOFF').click(function(){
		exitApp();
	});
}
function actualizaNotificacionRed(){
	//on off line
	if (hayRed == true){
		$j('#top-panel').addClass('online');
		$j('#hayRed').html('<i class="fa fa-refresh fa-spin ok"></i>');
	}else{
		$j('#top-panel').addClass('offline');
		$j('#hayRed').html('<i class="fa fa-refresh fa nok"></i>');
	}
	
}
function actualizaNotificacionGeo(){
	//geo Activa
	if (hayGeo){
		$j('#top-panel').addClass('online');
		$j('#hayGeo').html('<i class="fa fa-globe fa-spin ok"></i>');
	}else{
		$j('#top-panel').addClass('offline');
		$j('#hayGeo').html('<i class="fa fa-globe fa nok"></i>');
	}
}
function actualizaNumeroPedidos(){
    tarea = getTarea();
    if (tarea == undefined)
        return;
	//mete numero de pedidos
	$j('#MU-PEDIDOS').html('<span class="badge notificacion">'+tarea.pedidos.length+'</span>');
}
function actualizaNotificaciones(tarea){
	actualizaNotificacionRed();
	actualizaNotificacionGeo();
	actualizaNumeroPedidos();
}
function verPedido(pedido){
	//jQuery.mobile.changePage("pedido.html");
	partes = pedido.attr('id').split('_');
	id = partes[1];
	window.location = "pedido.html?pedido="+id;
	return false;
}
function generaLIPedido(pedido){
	html = '<li id="PD_'+pedido.id+'" class="list-group-item';
	if (pedido.asignado == 1){
		html += ' active';
	}
	html += '">'+pedido.descripcion+'<span class="badge">'+pedido.id+'</span>';
	html += '</li>';
	return html;
}

/*************************************************************
NEGOCIOS
*************************************************************/
/**
Obtiene el html que pintara el icono del negocio.
@param idPed Id del Pedido
@param negocio Negocio del que pintar el icono
@retult html del icono del negocio
*/
function getHtmlIconoNegocio(idPed, negocio){
    tarea = getTarea();
    if (tarea == undefined)
        return '';
    pedido = getPedidoPorId(idPedido); 
    pos = getPosicionNegocioPorId(pedido.pedido.id, negocio.id);
	html_ico = '';
	//si está en transito hacia el primer negocio (porque viene sin estado)
	if (pedido.pedido.estado == PEDIDO_NEGOCIO_ESTADO_EN_TRANSITO && pos == 0)
	    html_ico = '<i class="fa fa-location-arrow est-negocio est-negocio-transito"></i>';
	if (pedido.pedido.estado == PEDIDO_NEGOCIO_ESTADO_EN_TRANSITO && pos > 0)
        html_ico = '<i class="fa fa-exclamation est-negocio est-negocio-pendiente"></i>';
	//si está en transito al negocio
	if(negocio.estado == PEDIDO_NEGOCIO_ESTADO_EN_TRANSITO)
	    html_ico = '<i class="fa fa-location-arrow est-negocio est-negocio-transito"></i>';
	//si se está esperando
    if (negocio.estado == PEDIDO_NEGOCIO_ESTADO_ESPERANDO)
        html_ico = '<i class="fa fa-clock-o est-negocio est-negocio-esperando"></i>';
	//si el negocio está recogido
	if (negocio.estado == PEDIDO_NEGOCIO_ESTADO_RECOGIDO)
		html_ico = '<i class="fa fa-check-square-o est-negocio est-negocio-recogido"></i>';
		
	if (negocio.estado == PEDIDO_NEGOCIO_ESTADO_ANULADO)
		html_ico = '<i class="fa fa-ban est-negocio"></i>';
	return html_ico;
}

/**
 * Localiza la posicion de un negocio en la tarea por su id
 * @param id del negocio
 * @return posicion del negocio en el pedido, -1 si no lo encuentra
 */
function getPosicionNegocioPorId(idPedido, idNegocio){
    pedido = getPedidoPorId(idPedido);
    for(i=0;i<pedido.pedido.negocios.length;i++){
        if (pedido.pedido.negocios[i].id == idNegocio)
            return i;
    }
    return -1;
}
/**
Actualiza el estado de un negocio que aparece en la ruta de un pedido.
*/
function setEstadoNegocio(idPedido, idNegocio, estado, f, fe, token){
	console.log("Actualizando negocio..." + idPedido + ","+idNegocio+","+estado);
	if (hayRed){    
        pos = getPosicionPedidoPorId(idPedido, tarea);
        nNegocios = tarea.pedidos[pos].pedido.negocios.length;
        posNegocio = -1
        for(i=0;i < nNegocios;i++){
            if (tarea.pedidos[pos].pedido.negocios[i].id == idNegocio){
                tarea.pedidos[pos].pedido.negocios[i].estado = estado;
                if (estado == PEDIDO_NEGOCIO_ESTADO_RECOGIDO){
                    //si hay que ir a otro negocio, se indica que se está en ruta hacia él
                    if ((i+1) < nNegocios){
                        tarea.pedidos[pos].pedido.negocios[i+1].estado = PEDIDO_NEGOCIO_ESTADO_EN_TRANSITO;
                        idNegocio = tarea.pedidos[pos].pedido.negocios[i+1].id;
                        estado = PEDIDO_NEGOCIO_ESTADO_EN_TRANSITO;
                    }else{
                        //Si no hay más negocios, se cierra el paquete y se dirige al cliente
                        tarea.pedidos[pos].pedido.empaquetado = PEDIDO_PAQUETE_COMPLETO;
                        tarea.pedidos[pos].pedido.negocios[i].estado = PEDIDO_NEGOCIO_ESTADO_RECOGIDO;
                        tarea.pedidos[pos].pedido.estado = PEDIDO_ESTADO_EN_ENTREGA;
                        idNegocio = ID_CLIENTE;
                        estado = PEDIDO_ESTADO_EN_ENTREGA;
                    }
                }else{
                    //si se ha llegado al negocio
                     if (estado == PEDIDO_NEGOCIO_ESTADO_ESPERANDO){
                         tarea.pedidos[pos].pedido.negocios[i].estado = PEDIDO_NEGOCIO_ESTADO_ESPERANDO;
                         estado = PEDIDO_NEGOCIO_ESTADO_ESPERANDO;
                     }
                }                
                posNegocio = i;
                break;
            }
        }
	    
		if (token == undefined || token == null)
			token = getToken();
		//url = URL_PEDIDO_GESTION+'?'+PAR_PEDIDO_ID+'='+idPedido+'&'+PAR_ESTADO+'='+estado+'&'+PAR_NEGOCIO_ID+'='+idNegocio+'&'+PAR_TOKEN+'='+token+'&'+PAR_TS+'='+getTS();
		//json = fget(url,f, fe);
		url = URL_PEDIDO_GESTION;
		data = { 'idPed':idPedido,'est':estado,'idNeg':idNegocio,'token':token,'ts':getTS()};
		json = fpost(url, data, f, fe);
		if (json.code != undefined){
			if (json.code == -1){
				muestraMensaje("Se ha producido un error en el servidor.");
				return false;
			}else{
				if (json.code == 0){
				    setTarea(tarea);
	                actualizaHtmlNegocioPorPosicion(tarea.pedidos[pos].pedido, posNegocio);
				}
				else{
					if (json.code == 1){
						tarea = json;
						muestraMensaje("Su tarea ha sido actualizada por la central. Por favor, compruebe la.");
						setTarea(tarea);
					}
				}
			}
		}
	}else{
	    tarea = getTarea();                
        if (tarea == undefined)
            return;
	    pos = getPosicionPedidoPorId(idPedido, tarea);
        nNegocios = tarea.pedidos[pos].pedido.negocios.length;
        posNegocio = -1
        for(i=0;i < nNegocios;i++){
            if (tarea.pedidos[pos].pedido.negocios[i].id == idNegocio){
                tarea.pedidos[pos].pedido.negocios[i].estado = estado;
                if (estado == PEDIDO_NEGOCIO_ESTADO_RECOGIDO){
                    //si hay que ir a otro negocio, se indica que se está en ruta hacia él
                    if ((i+1) < nNegocios){
                        tarea.pedidos[pos].pedido.negocios[i+1].estado = PEDIDO_NEGOCIO_ESTADO_EN_TRANSITO;
                        idNegocio = tarea.pedidos[pos].pedido.negocios[i+1].id;
                        estado = PEDIDO_NEGOCIO_ESTADO_EN_TRANSITO;
                    }else{
                        //Si no hay más negocios, se cierra el paquete y se dirige al cliente
                        tarea.pedidos[pos].pedido.empaquetado = PEDIDO_PAQUETE_COMPLETO;
                        tarea.pedidos[pos].pedido.negocios[i].estado = PEDIDO_NEGOCIO_ESTADO_RECOGIDO;
                        tarea.pedidos[pos].pedido.estado = PEDIDO_ESTADO_EN_ENTREGA;
                        idNegocio = ID_CLIENTE;
                        estado = PEDIDO_ESTADO_EN_ENTREGA;
                    }
                }else{
                    //si se ha llegado al negocio
                     if (estado == PEDIDO_NEGOCIO_ESTADO_ESPERANDO){
                         tarea.pedidos[pos].pedido.negocios[i].estado = PEDIDO_NEGOCIO_ESTADO_ESPERANDO;
                         estado = PEDIDO_NEGOCIO_ESTADO_ESPERANDO;
                         idNegocio = tarea.pedidos[pos].pedido.negocios[i].id;
                     }
                }                
                posNegocio = i;
                break;
            }
            
        }
        
        pedido = tarea.pedidos[pos].pedido;
        tarea.pedidos[pos].pedido.estado = estado;
        setTarea(tarea);
        addCambio(pedido.id, estado, idNegocio);
        actualizaHtmlNegocioPorPosicion(pedido, posNegocio);        
        setTareaTS();
	    
	}
}

/**
 * Obtiene un determinado negocio desde un pedido por su id
 * @param idPed id del pedido
 * @param idNeg id del negocio
 * @param tarea Tarea del repartidor, es opcional
 * @return negocio del pedido, null si no existe
 */
function getNegocioPorId(idPed, idNeg, tarea){
    if (tarea == undefined){
        tarea = getTarea();
        if (tarea == undefined)
            return null;
    }
    pedido = getPedidoPorId(idPed, tarea);
    if (pedido == undefined || pedido == null)
        return null;
    for(i=0;i<pedido.pedido.negocios.length;i++){
        if (pedido.pedido.negocios[i].id == idNeg)
            return pedido.pedido.negocios[i];
    }
    return null;
}
/**
 * Obtiene el negocio actual de una tarea
 * @param tarea
 * @return 
 * null si no hay tarea, pedido o negocio actual.
 * -1 si se va hacia el cliente
 * json con el negocio actual y un nuevo campo que indica la posición el mismo en el pedido
 */
function getNegocioActual(){
    tarea = getTarea();
    if (tarea == undefined || tarea == null)
        return null;
    //solo se mira el primer pedido, ya que este puede ser el que esté en transito
    if (tarea.pedidos == undefined || tarea.pedidos.length==0)
        return null;
    pedido = tarea.pedidos[0].pedido;
    if (pedido == undefined || pedido.negocioActual == undefined)
        return null;
    negocioActual = pedido.negocioActual;
    if (negocioActual == ID_CLIENTE)
        return ID_CLIENTE;
    //si no tiene metidos los negocios
    if (pedido.negocios == undefined)
        return -1;
    //se localiza el negocio dentro del pedido
    for(i=0;i<pedido.negocios.length;i++){
        negocio = tarea.pedidos[i];
        if (negocio.id == pedido.negocioActual){
            negocio.posicion = i;
            return negocio;
        }
    }
    return null;
}

/**
 * Obtiene el negocio actual de la respuesta del servidor
 * @param tarea objeto json con la respuesta del servidor
 * @return 
 * null si no hay tarea, pedido o negocio actual.
 * -1 si se va hacia el cliente
 * json con el negocio actual y un nuevo campo que indica la posición el mismo en el pedido
 */
function getNegocioActualFromResponse(tarea){
    if (tarea == undefined || tarea == null)
        return null;
    //solo se mira el primer pedido, ya que este puede ser el que esté en transito
    if (tarea.pedidos == undefined || tarea.pedidos.length==0)
        return null;
    pedido = tarea.pedidos[0].pedido;
    
    if (pedido == undefined || pedido.negocioActual == null)
        return null;
    negocioActual = pedido.negocioActual;
    if (negocioActual == ID_CLIENTE)
        return ID_CLIENTE;
    //si no tiene metidos los negocios
    if (pedido.negocios == undefined)
        return -1;
    //se localiza el negocio dentro del pedido
    for(i=0;i<pedido.negocios.length;i++){
        negocio = tarea.pedidos[0].pedido.negocios[i];
        if (negocio.id == pedido.negocioActual){
            negocio.posicion = i;
            return negocio;
        }
    }
    return null;
}
/*************************************************************
POSICIONAMIENTO
*************************************************************/
function geoOK(position){
	//console.log("GEO: "+position.coords.latitude+','+position.coords.longitude);
	window.localStorage.setItem(HAY_GEO, hayGeo);
	latitud = position.coords.latitude;
	longitud = position.coords.longitude;
	data = {'lat':latitud,'lng':longitud};
	setPosicion(data);
	
	if (hayRed){
	    token = getToken();
	    if (token != undefined){
	        data.token = token;
	        json = fpost(URL_GEO, data);
	    }
	}
	
}
function geoError(error){	
	mensaje = '';
	switch(error.code)
	{
		case error.PERMISSION_DENIED:
			mensaje="Usuario negó la solicitud de Geolocalización."
			break;
		case error.POSITION_UNAVAILABLE:
			mensaje="La información de ubicación no está disponible."
			break;
		case error.TIMEOUT:
			mensaje="La solicitud para obtener la ubicación del usuario supero el tiempo de espera."
			break;
		case error.UNKNOWN_ERROR:
			mensaje="Se ha producido un error desconocido."
			break;
	}
	console.log("Problemas de posicionamiento: "+mensaje);	
	hayGeo = false;
	window.localStorage.setItem(HAY_GEO, hayGeo);
}
function posicionate(){
	navigator.geolocation.getCurrentPosition(geoOK, geoError);
}
function inicializaPosicionamiento(){
    if (monitorizarRepartidor)
        watchId = navigator.geolocation.watchPosition(geoOK, geoError, { maximumAge: GEO_CACHE, timeout: GEO_TIMEOUT });
	//posicionate();
}

/*************************************************************
RUTAS
*************************************************************/
function calcRoute(origen, destino, directionsService, directionsDisplay, mode) {
    var request = {
        origin: origen,
        destination: destino,
        travelMode: google.maps.TravelMode[mode]
    };
    directionsService.route(request, function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(response);
        }
    });    
}

function calcRutaConParadas(origen, destino, paradas, directionsService, directionsDisplay, mode){
    var request = {
            origin: origen,
            destination: destino,
            waypoints:paradas,
            travelMode: google.maps.TravelMode[mode]
        };
        directionsService.route(request, function(response, status)
            {
            if (status == google.maps.DirectionsStatus.OK){
                directionsDisplay.setDirections(response);
            }
        });    
}