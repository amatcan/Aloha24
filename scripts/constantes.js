/********************************************************+
RESTFULL
********************************************************/
const URL_LOGIN = "http://aloha24.com/alohages/ws/ws_getAuth.php";
const URL_PEDIDO_GESTION = "http://aloha24.com/alohages/ws/ws_setPedido.php";
const URL_SUBIR_CAMBIOS = "http://aloha24.com/alohages/ws/ws_setEstadosPedidos.php";
const URL_GEO = "http://aloha24.com/alohages/ws/ws_setCoord.php";
const URL_INIT = "http://aloha24.com/alohages/ws/ws_setInit.php";
/*
const URL_RESUMEN = "http://neexteam.esy.es/inicio.php";
const URL_PEDIDOS = "http://neexteam.esy.es/inicio.php";
const URL_PEDIDO_GESTION = "http://neexteam.esy.es/gespedido.php";
const URL_SUBIR_CAMBIOS = "http://neexteam.esy.es/sincronizar.php";
*/

const PAR_USERNAME = 'username';
const PAR_PASSWORD = 'password';
const PAR_PEDIDO_ID = 'idPed';
const PAR_NEGOCIO_ID = 'idNeg';
const PAR_ESTADO = 'est';
const PAR_TIMESTAMP = 'ts';
const PAR_TOKEN = 'token';

const PAGE_INDEX = "index.html";
const PAGE_DETALLE_PEDIDO = "pedido.html";
const PAGE_PEDIDOS = "pedidos.html";
const PAGE_MAPA = "mapa.html";

const USERNAME = "username";
const NOMBRE = "nombre"; //Nombre real del repartidor
const TOKEN = "token";
const PEDIDO = "pedido";
const TAREA = "tarea";
const CAMBIOS = "cambios";
const CLIENTE = "cliente";
const ALTO_TITULO = 45;
const ANCHO_NAV_PANEL = 65;
const ONLINE = "online";
const HAY_RED = "hayRed";
const HAY_GEO = "hayGeo";
const ID = "id";
const POSICION = "posicion";
const GEO_TIMEOUT = 30000;
const GEO_CACHE = 20000;
const POOL_TIMEOUT = 5000;

const ID_CLIENTE = -1; //Para usar cuando se indica transito al cliente

const SIN_ESTADO = -1;
//ESTADOS DE UNA TAREA
const TAREA_ESTADO_CREADA = 1; //se creo la tarea y todavía no está asignada a ningún repartidor
const TAREA_ESTADO_ASIGNADA = 2; //se asignó la tarea a un repartido y ESTÁ TRABAJANDO EN ELLA
const TAREA_ESTADO_CERRADA = 3; //tarea finalizada

//ESTADOS DE UN PEDIDO
//Estados comunes con el servidor
const PEDIDO_ESTADO_SIN_ASIGNAR = 1;
const PEDIDO_ESTADO_ASIGNADO = 2;
const PEDIDO_NEGOCIO_ESTADO_EN_TRANSITO = 3; //En transito hacia un negocio
const PEDIDO_NEGOCIO_ESTADO_ESPERANDO = 4; //Esperando en un negocio
const PEDIDO_ESTADO_EN_ENTREGA = 5;//En transito hacia un cliente
const PEDIDO_ESTADO_ENTREGANDO = 6; //Se ha llegado al domicilio del cliente y se procede a localizar a este para la entrega
const PEDIDO_ESTADO_CERRADO = 7;//Entregado 

//Estados propios de la app
const PEDIDO_NEGOCIO_ESTADO_RECOGIDO = 10; //recogido en un negocio
const PEDIDO_NEGOCIO_ESTADO_ANULADO = 11; //si un negocio lo quito el repartidor

const PEDIDO_PAQUETE_COMPLETO = 1; //El pedido está completo por lo que no quedan negocios por visitar
//MODOS DE PAGO
const MODO_PAGO_METALICO = 1;
const MODO_PAGO_PAYPAL = 2;

const RETURN_CODE_ERROR_SIN_RED = -2;
const RETURN_CODE_ERROR = -1;
const RETURN_CODE_OK = 0;
const RETURN_CODE_UPDATE = 1;
const RETURN_CODE_OK_SIN_RED = 2;
const RETURN_CODE_OK_PEDIDO_EN_CURSO = 3;
const RETURN_CODE_OK_NO_PEDIDO_EN_CURSO = 4;
const RETURN_CODE_LOGIN_OK = 0;
const RETURN_CODE_LOGIN_ERROR = -1;
