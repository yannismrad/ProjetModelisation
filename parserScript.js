/**ATTENTION : les regles sont lues de la plus précise a la plus générale ( ex : Argument sera traitée avant Header)
* Les objets doivent être construits à partir des règles les plus précises **/

/**
Représentation des règles en objets :
attributs :
- ID (string)
- Predecesseur (string)
- Successeur (string)
- Condition : -condition gauche (string) - operateur(string) - condition droite (string)
- Operations[Operation] : Operation1(Type(string), arguments[strings]), Operation2(....)....
	=> Pour les subdiv operations : type (subdiv ici), axe, tableau de sous-formes, tableau des tailles de chaque sous-forme 
	=> Pour les autres operations : type, tailles sur x,y,z (pour les transformations) ou nom de la forme (pour l'insertion)
**/


//Règles
Rules //Génère une erreur "invalid assignment" en console
= Rule+

//Règle de production = en tête -> queue
//Quand on a parsé la règle entière, on la traite
Rule
= '#'Header WhiteSpace (':' WhiteSpace (Condition WhiteSpace)*)? "-->" WhiteSpace Tail Successor* WhiteSpace Probability* ruleEnd:';' WhiteSpace
{
	processCurrentRule();
}


// En tête = nom de la forme (argument, argument...) //A modifier
Header
= id:String WhiteSpace ':' WhiteSpace predecessor:String WhiteSpace ('(' WhiteSpace argumentList:ArgumentList WhiteSpace')')* WhiteSpace
{
	var stringId ="", stringPred ="";
	
	//On met l'id et le predecessor sous forme d'un string entier car actuellement ce sont des tableaux[][]
	var idArray = id[0];
	var predArray = predecessor[0];
	
	for(var i=0; i< idArray.length;i++)
		stringId += idArray[i];
		
	for(var i=0; i< predArray.length;i++)
		stringPred += predArray[i];

	startNewRule(stringId, stringPred);
}

//Liste d'arguments = arg1, autresArgs
ArgumentList
= WhiteSpace Argument','* WhiteSpace OtherArguments* WhiteSpace //liste d'args = 1 argument au minimum

//Argument = chaine de characteres
Argument
= arg:String
{ 
	var argArray = arg[0]; //argument est fourni sous forme de tableau [0][lettre]
	var stringArg = "";
	
	for(var i=0; i< argArray.length;i++)
		stringArg += argArray[i];
		
	addRuleArgument(stringArg); 

}

//Autres args = liste d'args
OtherArguments
= ArgumentList


Successor
= successor:String
//{ alert(successor);}

//Condition = parametre > < == ou != valeur
Condition
= condiLeft:String WhiteSpace condiOperator:ConditionOperator WhiteSpace condiRight:String
{
	var condiLeftArray = condiLeft[0];
	var condiOperatorArray = condiOperator[0];
	var condiRightArray = condiRight[0];
	var stringCondiL = "", stringCondiOp = "", stringCondiR = "";
	
	//Tableau --> string
	for(var i=0; i< condiLeftArray.length;i++)
		stringCondiL += condiLeftArray[i];
		
	for(var i=0; i< condiRightArray.length;i++)
		stringCondiR += condiRightArray[i];
		
	for(var i=0; i< condiOperatorArray.length;i++)
		stringCondiOp += condiOperatorArray[i];


	addRuleCondition(stringCondiL, stringCondiOp, stringCondiR);
}

ConditionOperator
= "==" / ">=" / "<=" / "!=" / "<"/ ">"


//Probabilité
Probability
= ':' FloatNumber

Tail
= OperationList Tail / WhiteSpace

//Liste d'opérations (limitation à une seule paire de [] à la fois)
OperationList
= Operation WhiteSpace
/ Operation WhiteSpace OperationList
/ '[' WhiteSpace OperationList WhiteSpace ']'
/ '[' WhiteSpace OperationList WhiteSpace ']' WhiteSpace OperationList
/ Operation WhiteSpace '[' WhiteSpace OperationList WhiteSpace ']'



//Operation = scope operation ou subdiv operation avec liste de params
Operation
= ScopeOperation  / SplitOperation

ScopeOperation
= ScopeInsert / ScopeTranslate / ScopeRotate / ScopeResize

ScopeTranslate
= 'T' WhiteSpace '(' WhiteSpace tx:FloatNumber WhiteSpace','WhiteSpace ty:FloatNumber WhiteSpace',' WhiteSpace tz:FloatNumber WhiteSpace ')'
{
	var tOperation = new Object();
	tOperation.type = "T";

	var stringTx = "", stringTy = "", stringTz = "";
		
	//Concatenation des chiffres pour tx (tx est donné sous forme de tableau)
	for(var i=0; i< tx.length;i++)
	{
		for(var j=0; j< tx[i].length;j++)
			stringTx+= tx[i][j];
	}
	
	//Idem pour ty
	for(var i=0; i< ty.length;i++)
	{
		for(var j=0; j< ty[i].length;j++)
			stringTy+= ty[i][j];
	}
	
	//Idem pour tz
	for(var i=0; i< tz.length;i++)
	{
		for(var j=0; j< tz[i].length;j++)
			stringTz+= tz[i][j];
	}
	
	
	tOperation.tx = parseFloat(stringTx);
	tOperation.ty = parseFloat(stringTy);
	tOperation.tz = parseFloat(stringTz);
	
	//console.log("Operation "+tOperation.type + " : "+tOperation.tx + ", "+tOperation.ty+ ", "+ tOperation.tz);
	
	addOperation(tOperation);
	
}

ScopeRotate
= 'R' WhiteSpace '(' WhiteSpace rx:FloatNumber WhiteSpace','WhiteSpace ry:FloatNumber WhiteSpace','WhiteSpace rz:FloatNumber WhiteSpace ')'
{
	var rOperation = new Object();
	rOperation.type = "R";
	
	var stringRx = "", stringRy = "", stringRz = "";
		
	//Concatenation rx
	for(var i=0; i< rx.length;i++)
	{
		for(var j=0; j< rx[i].length;j++)
			stringRx+= rx[i][j];
	}
	
	//Idem pour ry
	for(var i=0; i< ry.length;i++)
	{
		for(var j=0; j< ry[i].length;j++)
			stringRy+= ry[i][j];
	}
	
	//Idem pour rz
	for(var i=0; i< rz.length;i++)
	{
		for(var j=0; j< rz[i].length;j++)
			stringRz+= rz[i][j];
	}
	
	
	rOperation.rx = parseFloat(stringRx);
	rOperation.ry = parseFloat(stringRy);
	rOperation.rz = parseFloat(stringRz);
	
	addOperation(rOperation);
	
}

ScopeResize
= 'S' WhiteSpace '(' WhiteSpace sx:FloatNumber WhiteSpace','WhiteSpace sy:FloatNumber WhiteSpace',' WhiteSpace sz:FloatNumber WhiteSpace ')'
{
	var sOperation = new Object();
	sOperation.type = "S";
	
	var stringSx = "", stringSy = "", stringSz = "";
		
	//Concatenation sx
	for(var i=0; i< sx.length;i++)
	{
		for(var j=0; j< sx[i].length;j++)
			stringSx+= sx[i][j];
	}
	
	//Idem pour sy
	for(var i=0; i< sy.length;i++)
	{
		for(var j=0; j< sy[i].length;j++)
			stringSy+= sy[i][j];
	}
	
	//Idem pour sz
	for(var i=0; i< sz.length;i++)
	{
		for(var j=0; j< sz[i].length;j++)
			stringSz+= sz[i][j];
	}
	
	
	sOperation.sx = parseFloat(stringSx);
	sOperation.sy = parseFloat(stringSy);
	sOperation.sz = parseFloat(stringSz);
	
	addOperation(sOperation);
	
}

ScopeInsert
= 'I' WhiteSpace '(' WhiteSpace '"'shapeName:String'"' WhiteSpace ')'
{
	var iOperation = new Object();
	iOperation.type = "I";
	
	var stringName = "";
	
	
	for(var i=0; i< shapeName.length;i++)
	{
		for(var j=0; j< shapeName[i].length;j++)
			stringName+= shapeName[i][j];
	}
	
	iOperation.shapeName = stringName;
	
	addOperation(iOperation);
	
}


SplitOperation
= BasicSplit //ajouter d'autres split ?

BasicSplit
= 'subdiv' WhiteSpace '(' WhiteSpace '"'axis:SplitAxis'"' WhiteSpace ',' WhiteSpace sizeList:SizesList WhiteSpace ')' WhiteSpace '{' WhiteSpace SubShapeList WhiteSpace '}' WhiteSpace
{
	var subdivOperation = new Object();
	subdivOperation.type = "subdiv";
	var tmpSubDivShapes = getTmpSubdivShapeList(); //liste des sous-formes
	var tmpSubDivSizes = getTmpSubdivSizeList(); // liste des tailles de chaque sous forme
	
	//console.log("tmp shapeList = ");
	//console.log(tmpSubDivShapes);
	
	subdivOperation.axis = axis[0];
	subdivOperation.shapeNamesArray = tmpSubDivShapes;
	subdivOperation.shapeSizesArray = tmpSubDivSizes;
	
	
	addSubdivOperation(subdivOperation);
}

//Axe de subdivision
SplitAxis
= 'x'/'X'/'y'/'Y'/'z'/'Z'

SubShapeList
= Shape+ WhiteSpace OtherShapes / Shape / WhiteSpace

Shape
= shapeName:String
{
	var stringName = "";
	for(var i=0; i< shapeName.length;i++)
	{
		for(var j=0; j< shapeName[i].length;j++)
			stringName+= shapeName[i][j];
	}
	
	//Ajouter la shape a la liste des shapes pour l'operation subdiv actuelle
	addShapeToSubdivShapeList(stringName);
}

OtherShapes
= '|' WhiteSpace Shape WhiteSpace OtherShapes
/ WhiteSpace

//Liste des tailles de subdiv. pour chaque sous-forme à obtenir
SizesList
= Size WhiteSpace (',' WhiteSpace SizesList)*

Size
= shapeSize:FloatNumber
{
	//alert("size = "+shapeSize);
	
	var stringSize = "";
	for(var i=0; i< shapeSize.length;i++)
	{
		for(var j=0; j< shapeSize[i].length;j++)
			stringSize+= shapeSize[i][j];
	}
	
	//Ajouter la size a la liste des sizes pour l'operation subdiv actuelle
	addSizeToSubdivSizeList(parseFloat(stringSize));
}




FloatNumber
= [0-9]+'.'[0-9]+ 
/ [0-9]+

//Chaine de carac = 1 char ou + (alphanumerique)
String
= (Character+)

Character
= [a-zA-z0-9]+

WhiteSpace "whitespace"
  = [ \t\n\r]*