import React from "react";
import { Button, Form, Grid, Header } from "semantic-ui-react";
import { setPreference } from "../store/user";
import { connect } from "react-redux";
import history from "../history";
import Navbar from "./navbar";
import PrefCard from "./PreferenceCard";
import Box from "./Box";

class Preference extends React.Component {
  state = {
    favCuisines: [],
    favIngredients: [],
    mealTypes: [],
    favCategory: []
  };

  handleSubmit = e => {
    e.preventDefault();
    const preferencesObj = {
      favCuisines: this.state.favCuisines,
      favIngredients: this.state.favIngredients,
      mealTypes: this.state.mealTypes,
      favCategory: this.state.favCategory
    };
    this.props.setPreference(preferencesObj, this.props.user.id);
    history.push("/home");
  };

  handleCheck = e => {
    if (e.target.checked === true) {
      this.state[`${e.target.value}`].push(e.target.name);
    } else {
      const index = this.state[`${e.target.value}`].indexOf(e.target.name);
      this.state[`${e.target.value}`].splice(index, 1);
    }
  };

  handleDrop = (name, type) => {
    this.state[`${type}`].push(name);
  };

  cuisines = [
    "chinese",
    "italian",
    "mexican",
    "american",
    "indian",
    "german",
    "japanese",
    "british",
    "french"
  ];
  ingredients = [
    "chicken",
    "beef",
    "pork",
    "seafood",
    "cheese",
    "mushrooms",
    "pesto",
    "tomatoes",
    "potatoes"
  ];
  categories = [
    "pasta",
    "quick",
    "dessert",
    "alcohol",
    "salad",
    "baking",
    "roast",
    "breakfast",
    "appetizer"
  ];
  statements = [
    "I am vegetarian.",
    "I prefer low-calorie recipes.",
    "I prefer easy, quicky recipes."
  ];

  render() {
    return (
      <div>
        <Navbar />
        <Form onSubmit={this.handleSubmit}>
        <div className="drag_things_to_boxes">
          <Grid columns={3}>

              <Grid.Row>
                <Grid.Column>
                  <Header as='h3' textAlign="center" attached="top">Cuisines:</Header>
                  <PrefCard
                    name="Cuisines"
                    items={this.cuisines}
                    handleDrop={this.handleDrop}
                    type="favCuisines"
                  />
                </Grid.Column>
                <Grid.Column>
                <Header as='h3' textAlign="center" attached="top">Ingredients:</Header>
                  <PrefCard
                    name="Ingredients"
                    items={this.ingredients}
                    handleDrop={this.handleDrop}
                    type="favIngredients"
                  />
                </Grid.Column>
                <Grid.Column>
                <Header as='h3' textAlign="center" attached="top">Categories:</Header>
                  <PrefCard
                    name="Categories"
                    items={this.categories}
                    handleDrop={this.handleDrop}
                    type="favCategory"
                  />
                </Grid.Column>
              </Grid.Row>

              <Grid.Row>
                <Grid.Column>
                  <Box targetKey="favCuisines" handleX={this.handleDrop} />
                </Grid.Column>
                <Grid.Column>
                  <Box targetKey="favCuisines" handleX={this.handleDrop} />
                </Grid.Column>
                <Grid.Column>
                  <Box targetKey="favCuisines" handleX={this.handleDrop} />
                </Grid.Column>
              </Grid.Row>
          </Grid>
        </div>
        <Button type="submit">Submit</Button>
        </Form>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  user: state.user
});
const mapDispatchToProps = dispatch => ({
  setPreference: (pref, id) => dispatch(setPreference(pref, id))
});
export default connect(mapStateToProps, mapDispatchToProps)(Preference);
