var filePath = "input.txt", grammarPath="parserScript.js";
var container,camera, scene, renderer;
var PegParser;

var scope; //objet scope
var shapeArray; //liste des formes � cr�er

//Variables utilis�es pour chaque regle
var currentRule, previousRule; //Regle de production actuellement lue, r�gle pr�c�dente
var currentArgumentList = new Array(); // liste d'arguments de la regle actuelle
var currentCondition = new Object(); //Condition de la regle actuelle
var currentOperationList = new Array(); //tableau contenant les operations utilis�es dans la r�gle actuelle
var tmpSubdivShapeList = new Array(); //liste de formes pour chaque operation subdiv dans la regle actuelle (videe entre chaque subdiv)
var tmpSubdivSizeList = new Array(); //liste des tailles des formes pour chaque operation subdiv de la regle actuelle


/** 
* Initialisation (jQuery)
**/
$(document).ready(function(){
	initRenderer();
	initScopeObject();
	readGrammarFile();
	parseInputFile();
});

/**
* Initialisation du renderer THREE.js
**/
function initRenderer() {
	var renderer = new THREE.WebGLRenderer();
	renderer.setSize( 800, 600 );
	document.body.appendChild( renderer.domElement );

	var scene = new THREE.Scene();

	var camera = new THREE.PerspectiveCamera(
		35,             // Field of view
		800 / 600,      // Aspect ratio
		0.1,            // Near plane
		10000           // Far plane
	);
	camera.position.set( -15, 10, 10 );
	camera.lookAt( scene.position );

	var geometry = new THREE.BoxGeometry( 5, 5, 5 );
	var material = new THREE.MeshLambertMaterial( { color: 0xFF0000 } );
	var mesh = new THREE.Mesh( geometry, material );
	scene.add( mesh );

	var light = new THREE.PointLight( 0xFFFF00 );
	light.position.set( 10, 0, 10 );
	scene.add( light );

	renderer.setClearColor( 0xdddddd, 1);
	renderer.render( scene, camera );	
}


/**
* Initialisation du scope � manipuler pour creer des objets
* (Objet virtuel qui sert � d�finir la position des objets Three.JS a creer, leur taille etc)
**/
function initScopeObject()
{
	scope = new Object();
	scope.P = new THREE.Vector3(0,0,0); // Position dans l'espace
	scope.R = new THREE.Vector3(0,0,0); //Rotation
	//scope.X = new THREE.Vector3(1,0,0); // Axe X du rep�re du scope (pour rotation)
	//scope.Y = new THREE.Vector3(0,1,0); // Axe Y du rep�re du scope (pour rotation)
	//scope.Z = new THREE.Vector3(0,0,1); // Axe Z du rep�re du scope (pour rotation)
	scope.S = new THREE.Vector3(1,1,1); // S : vecteur de taille du scope sur X,Y,Z
	
}

/**
* Fonction qui parse une r�gle de production, reset la variable currentRule d�s qu'une nouvelle r�gle est lue (lecture du # de d�but de r�gle)
* + Param�tres id, predecesseur et nouvelle liste d'arguments
* ATTENTION : la construction de la regle se fait � la toute fin, quand on a pars� chaque �l�ment (argument, condition etc ...)
**/
function startNewRule(id, predecessor)
{
	//alert("id ="+id+" pred ="+predecessor);
	//Si on avait lu une r�gle juste avant, on la garde en m�moire dans la variable previous
	if(currentRule != "undefined")
	{
		previousRule = currentRule;
		delete currentRule;
	}
	currentRule = new Object();
	currentRule.argumentList = new Array();

	//OBJET r�gle accessible lorsque toute la r�gle a �t� pars�e (OPERATIONS THREE JS A FAIRE dans processCurrentRule)
	currentRule.id = id;
	currentRule.predecessor = predecessor;
	currentRule.argumentList = currentArgumentList;
	currentRule.condition = currentCondition;
	currentRule.operations = currentOperationList;
	
	//Fin du parsing de la r�gle (traitement dans processCurrentRule)
}


/**
* Fonction pour traiter la re�gle courante puis remettre a zero les variables utilis�es pour construire chaque regle (� chaque fin de r�gle rencontr�e)
* Pour pouvoir les reutiliser d'une r�gle � une autre
**/
function processCurrentRule()
{
	//TODO V�rifier les conditions (attribut condition de l'objet currentRule) avant execution des op�rations
	
	//Appliquer toutes les op�rations de la r�gle trait�e sur le scope
	console.log("applying operations on rule : ");
	console.log(currentRule);
	applyOperations();

	
	
	
	/** RESET DES VARIABLES **/
	//Reset de la currentArgumentList pour l'utiliser pour la prochaine r�gle
	currentArgumentList = new Array();
	
	//Reset de la condition
	currentCondition = new Object();
	
	//console.log("OPERATION LIST : ");
	//console.log(currentOperationList);
	
	//Reset de la liste des operations
	currentOperationList = new Array();
	
	//Reset des listes des formes et des tailles pour l'operation de subdivision
	tmpSubdivShapeList = new Array();
	tmpSubdivSizeList = new Array();
}




/**
* Fonction pour appliquer les op�rations de la current rule sur l'objet scope
* TODO : Faut il reset le scope entre chaque r�gle ?
**/
function applyOperations()
{
	//Parcours s�quentiel de toutes les op�rations de la r�gle courante
	for(var i =0; i< currentRule.operations.length; i++)
	{
		var operation = currentRule.operations[i];
		
		//Translation du scope
		if(operation.type == "T")
		{
			scope.P.x += operation.tx;
			scope.P.y += operation.ty;
			scope.P.z += operation.tz;
		}
		
		//Rotation du scope
		if(operation.type == "R")
		{
			scope.R.x += operation.rx;
			scope.R.y += operation.ry;
			scope.R.z += operation.rz;
		}
		
		//Resize du scope
		if(operation.type == "S")
		{
			scope.S.x += operation.sx;
			scope.S.y += operation.sy;
			scope.S.z += operation.sz;
		}
		
	}
	
}




/**
* Fonction pour ajouter des arguments/parametres a la regle courante
**/
function addRuleArgument(argument)
{
	if(currentArgumentList == "undefined")
	{
		//alert("arg list undefined");
		currentArgumentList = new Array();
	}
		
	currentArgumentList.push(argument);
}

/**
* Fonction pour ajouter une condition a la regle courante
**/
function addRuleCondition(condiLeft, condiOperator, condiRight)
{
	if(currentCondition == "undefined")
	{
		currentCondition = new Array();
	}
	
	//Propri�t�s de la condition de la r�gle
	currentCondition.condiLeft = condiLeft;
	currentCondition.condiOperator = condiOperator;
	currentCondition.condiRight = condiRight;
}


/**
* Fonction pour ajouter des operations
**/
function addOperation(operation)
{
	if(currentOperationList == "undefined")
	{
		currentOperationList = new Array();
	}
	
	//console.log("Ajout de l'operation : ");
	//console.log(operation);
	
	currentOperationList.push(operation);
}

/**
* Fonction pour ajouter des operations de subdivision
**/
function addSubdivOperation(subdivOperation)
{
	//console.log("tmp subdivList = ");
	//console.log(tmpSubdivList);
	
	//On push l'operation subdiv avec les autres operations classiques, dans la liste pour la r�gle actuelle
	currentOperationList.push(subdivOperation);
	
	//A la fin du push, on vide la liste tmp de shapes et de sizes pour les utiliser pour une prochaine operation subdiv
	tmpSubdivShapeList = new Array();
	tmpSubdivSizeList = new Array();
}

/**
* Ajouter une sous-forme a la liste de sous-formes pour l'operation de subdivision actuellement trait�e
**/
function addShapeToSubdivShapeList(shapeName)
{
	tmpSubdivShapeList.push(shapeName);
}

/**
* Ajouter une size a la liste des tailles des sous-formes pour l'operation de subdivision actuelle
**/
function addSizeToSubdivSizeList(shapeSize)
{
	tmpSubdivSizeList.push(shapeSize);
}

function getTmpSubdivShapeList()
{
	return tmpSubdivShapeList;
}

function getTmpSubdivSizeList()
{
	return tmpSubdivSizeList;
}


/**M�thode pour r�cup�rer la grammaire pour le parser PEG **/
function readGrammarFile()
{
	var urls = [grammarPath];
	xhrDoc= new XMLHttpRequest();   
	xhrDoc.open('GET', urls[0] , false);
	if (xhrDoc.overrideMimeType)
		xhrDoc.overrideMimeType('text/javascript; charset=x-user-defined')
	xhrDoc.onreadystatechange =function()
	{
		if (this.readyState == 4)
		{
			if (this.status == 200)
		   {
				var grammarData= this.response; //string reponse
				
				PegParser= PEG.buildParser(grammarData);	
		   }

		}                   
	}
	xhrDoc.send();
}



/**M�thode pour r�cup�rer l'input et le parser dans PEG**/
function parseInputFile()
{
	var urls = [filePath];
	xhrDoc= new XMLHttpRequest();   
	xhrDoc.open('GET', urls[0] , false);
	if (xhrDoc.overrideMimeType)
		xhrDoc.overrideMimeType('text/plain; charset=x-user-defined')
	xhrDoc.onreadystatechange =function()
	{
		if (this.readyState == 4)
		{
			if (this.status == 200)
		   {
				var data= this.response; //string reponse
				
				PegParser.parse(data);	
		   }

		}                   
	}
	xhrDoc.send();
}
