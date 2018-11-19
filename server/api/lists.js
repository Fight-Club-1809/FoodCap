const router = require('express').Router();
const { User } = require('../db/models');
const { createUser } = require('../utils/createUsers');
const { runQuery, driver } = require('../db/neo');
const uuidv1 = require('uuid/v1');
const neo4j = require('neo4j-driver').v1;

module.exports = router;
//TODO:
//add way to verify a user owns a list

//POST (/api/lists)
//expects: req.body.listName
//creates a list node that is has a relationship to
//req.user.uuid
router.post('/', async (req, res, next) => {
	try {
		const { listName } = req.body;
		const { records } = await runQuery(
			`MATCH (a:Person {uuid: '${
				req.user.uuid
			}'}) CREATE (l:List {name:'${listName}', uuid: '${uuidv1()}'}) MERGE (a)-[:hasList{status:'incomplete'}]->(l) RETURN l`
		);
		//console.log(records);
		const { name, uuid } = records[0].get('l').properties;
		res.json({ name, uuid });
	} catch (err) {
		next(err);
	}
});

//GET (/api/lists)
//expects: nothing required
//returns the current logged in user (req.user)'s lists
// only returns name and uuid
router.get('/', async (req, res, next) => {
	try {
		console.log();
		const { records } = await runQuery(
			`MATCH (a:Person {uuid: '${
				req.user.uuid
			}'})-[r:hasList]-(l:List) RETURN l,r`
		);
		const returnObject = [];

		records.forEach((record, i) => {
			const props = record.get('l').properties;
			const relationship = record.get('r').properties;
			console.log(relationship);
			returnObject[i] = {};
			for (let key in props) {
				returnObject[i][key] = props[key];
			}
			for (let key in relationship) {
				returnObject[i][key] = relationship[key];
			}
		});
		res.json(returnObject);
	} catch (err) {
		next(err);
	}
});

//GET (/api/lists/:listId)
//expects: nothing required
//returns the details for one list

//a: Person
//l: list
//r: relationship for hasIngredient
//i: ingredient
//z: recipe to add to
router.get('/:listId', async (req, res, next) => {
	try {
		const { listId } = req.params;
		console.log(listId);
		let { records } = await runQuery(
			`MATCH (a:Person {uuid: $uuid})-[:hasList]-(l:List {uuid: $listuuid}) OPTIONAL MATCH (l)-[r:hasIngredient]-(x) RETURN l,x.name,r UNION MATCH (a:Person {uuid: $uuid})-[:hasList]-(l:List {uuid: $listuuid}) OPTIONAL MATCH (l)-[r:hasRecipe]-(x)RETURN l, x.name, r`,
			{
				listuuid: listId,
				uuid: req.user.uuid,
			}
		);

		const { name, uuid } = records[0].get('l').properties;
		const returnObject = { name, uuid, ingredients: [], recipies: [] };

		//switch the relationship type and do something different
		//for each relationship (store recipe name or ingredients)
		records.forEach(record => {
			const rel = record.get('r');
			if (rel.type) {
				switch (rel.type) {
					case 'hasIngredient': {
						const { type, quantity } = record.get('r').properties;
						returnObject.ingredients.push({
							name: record.get('x.name'),
							type,
							quantity,
						});
						break;
					}
					case 'hasRecipe': {
						returnObject.recipies.push(record.get('x.name'));
						break;
					}
					default:
						break;
				}
			}
		});
		res.json(returnObject);
	} catch (err) {
		next(err);
	}
});

//PUT (/api/lists/favorite)
//expects: req.body.uuid to match the uuic of list
router.put('/favorite', async (req, res, next) => {
	try {
		const { uuid } = req.body;
		console.log('in route ');
		console.log(req.body);

		const { records } = await runQuery(
			`MATCH (a:Person {uuid: '${
				req.user.uuid
			}'}) MATCH(l:List {uuid: '${uuid}'}) MERGE (a)-[r:isFavorite]->(l) RETURN r`
		);
		console.log();
		res.json({ relationship: records[0].get('r').type });
	} catch (err) {
		next(err);
	}
});

//PUT (/api/lists/addrecipe)
//expects: req.body.uuid to match the uuic of list
//         req.body.recipe to match the name of the recipe
router.put('/addrecipe', async (req, res, next) => {
	try {
		//list uuid and recipe name
		const { uuid, recipe } = req.body;

		const { records } = await runQuery(
			`MATCH (l:List {uuid: '${uuid}'})
      MATCH(r:Recipe {name: '${recipe}'})
      MATCH (r)-[z:hasIngredient]->(i)
      MERGE (l)-[newIngredient:hasIngredient]->(i)
      MERGE (l)-[:hasRecipe]->(r)
      SET newIngredient += properties(z)
       RETURN l,r,i`
		);
		console.log(records);
		res.json({ records });
		// set ingredient += properties(z)
	} catch (err) {
		next(err);
	}
});

/*
change above to the following when adding to check if list belongs to user
const {records} = await session.run(
      `MATCH (:Person {uuid: '${
        req.user.uuid
      }'})-[:HAS_LIST]->
        (l:List {uuid: '${
       uuid
      }'}) MATCH(r:Recipe {name: '${recipe}'}) MATCH (r)-[z:hasIngredient]->(i) MERGE (l)-[:hasIngredient{quantity: z.quantity, type: z.type}]->(i) RETURN l,r`
    )
    */

//PUT (/api/lists/addingredient)
//expects: req.body.uuid to match the uuic of list
//         req.body.ingredient to be the name of ingredient
//        req.body.quantity to be the quantity of ingredient
//        req.body.type to be the type for quantity
router.put('/addingredient', async (req, res, next) => {
	try {
		//list uuid and recipe name
		const { uuid, ingredient, quantity, type } = req.body;
		console.log('in route ');
		console.log(req.body);

		const { records } = await runQuery(
			`MATCH (l:List {uuid: $uuid})
      MERGE(i:Ingredient {name: $ingredient})
      MERGE (l)-[:hasIngredient{quantity: $quantity, type: $type}]->(i)
			 RETURN l,i`,
			{
				uuid,
				ingredient,
				quantity,
				type,
			}
		);
		console.log(records);
		res.json({ records });
	} catch (err) {
		next(err);
	}
});
//add below to above when adding user autentication
/*
`MATCH (:Person {uuid: '${
  req.user.uuid
}'})-[:HAS_LIST]->
*/

//PUT (/api/lists/removeingredient)
//expects: req.body.uuid to match the uuic of list
//         req.body.ingredient to be the name of ingredient
router.put('/removeingredient', async (req, res, next) => {
	try {
		//list uuid and recipe name
		const { uuid, ingredient } = req.body;
		console.log('in route ');
		console.log(req.body);

		const { records } = await runQuery(
			`MATCH (l:List {uuid: '${uuid}'})-[r:hasIngredient]->(i:Ingredient{name:'${ingredient}'}) DELETE r
       RETURN l`
		);
		console.log(records);
		res.json({ records });
	} catch (err) {
		next(err);
	}
});
//add below to above when adding user autentication
/*
`MATCH (:Person {uuid: '${
  req.user.uuid
}'})-[:HAS_LIST]->
*/

//PUT (/api/lists/updateingredient)
//expects: req.body.uuid to match the uuic of list
//         req.body.ingredient to be the name of ingredient
//         req.body.quantity to be new quantity #
router.put('/updateingredient', async (req, res, next) => {
	try {
		//list uuid and recipe name
		const { uuid, ingredient, quantity, type } = req.body;
		console.log('in route ');
		console.log(req.body);

		const { records } = await runQuery(
			`MATCH (l:List {uuid: '${uuid}'})-[r:hasIngredient]->(i:Ingredient{name:'${ingredient}'}) SET r.quantity='${quantity}', r.type='${type}'
       RETURN l`
		);

		console.log(records);
		res.json({ records });
	} catch (err) {
		next(err);
	}
});
//add below to above when adding user autentication
/*
`MATCH (:Person {uuid: '${
  req.user.uuid
}'})-[:HAS_LIST]->
*/
