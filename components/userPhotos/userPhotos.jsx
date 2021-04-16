import React from 'react';
import {
  Typography, CardMedia, CardContent, Card, ListItem, ListItemText,
} from '@material-ui/core';
import './userPhotos.css';
import { Link } from "react-router-dom";
import axios from 'axios';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { Copyright } from '@material-ui/icons';


/**
 * Define UserPhotos, a React componment of CS142 project #5
 */
class UserPhotos extends React.Component {
  constructor(props) {
    console.log('props ', props);
    super(props);
    this.state = { myPhotos: null, newComment: "", button: 1, buttonColor: 'primary', buttonText: 'LIKE', likesCount: {}, deleted: false, photoUrl: '' };
    console.log("hello");
  }

  fetchPhoto = () => {
    axios.get(this.state.photoUrl).then((response) => {

      console.log("inside fetching photos 2");
      this.setState({ myPhotos: response.data });
      // console.log("response obj", response);
      // console.log("response.data", response.data);
    }).catch(err => { console.log(err) });//fetch photos again
  }


  componentDidMount() {
    // console.log("photos has mounted");
    //get axios response 
    var url = "/photosOfUser/" + this.props.match.params.userId.toString();
    this.setState({ photoUrl: url });
    console.log('photo url test ', this.state.photoUrl);

    axios.get(url).then((response) => {
      // console.log("inside response photos", response);
      this.setState({ myPhotos: response.data });
      // console.log("response obj", response);
      // console.log("response.data", response.data);
    }).catch(err => { console.log(err) })
  }


  componentDidUpdate(prevProps, prevState) {
    // console.log("photos has updated");
    //console.log(this.props);
    console.log(prevProps, prevState);

    if (this.props !== prevProps) {
      var url = "/photosOfUser/" + this.props.match.params.userId.toString();
      this.setState({ photoUrl: url });
      console.log('cmpdidupdate called');
      var url = "/photosOfUser/" + this.props.match.params.userId.toString();
      console.log(url);
      axios.get(url).then((response) => {
        // console.log("inside response photos", response);

        this.setState({ myPhotos: response.data });
        // response = response.data;

        return;
      }).catch(err => { console.log(err) })
    }



  }

  render() {
    if (this.state.myPhotos === null) {
      return (<div>Loading....</div>);
    }
    else {
      return (

        <div>


          <h2>This is photos page!</h2>
          <div className="photoCard">
            {this.state.myPhotos.map((item) => (

              //initialize likes count to 0


              <div key={item._id}>
                <Card>
                  <CardMedia
                    component="img"
                    height="500"
                    src={"/images/" + item.file_name}
                  />
                  <Button
                    type='submit'
                    variant='contained'
                    color={this.state.buttonColor}
                    onClick={(e) => {
                      e.preventDefault();
                      console.log("new btn pressed");
                      var temp = this.state.button;
                      // var increment = 0;
                      //post request 
                      // temp === 0 ? increment = -1 : increment = 1;
                      var increment = 1;
                      var promise = axios.post('/like/', { photo_id: item._id, user_id: item.user_id });
                      // console.log('resp test ', resp);

                      promise.then(response => {
                        // console.log('response check ', response.data);
                        //last action was unlike -- next action is like
                        if (response.data[1] === 'LIKE') {
                          this.setState({ buttonText: 'LIKE' });
                        }
                        //last action was like -- next action is unlike 
                        else if (response.data[1] === 'UNLIKE') {
                          this.setState({ buttonText: 'UNLIKE' });
                        }
                      }).then(
                        this.fetchPhoto(),
                      )



                    }}

                  >{this.state.buttonText}</Button>
                  {item.numLikes === undefined ? <Typography> Likes 0</Typography> :


                    <Typography>Likes {item.numLikes}</Typography>

                    //button for
                  }
                  <Button variant='contained' color='secondary'
                    onClick={(e) => {
                      //make api call
                      //make object 
                      let obj = { photo_id: item._id, user_id: item.user_id }
                      // console.log(obj);
                      axios.post('/deletePhoto/', obj).then(response => {
                     

                      }).then(
                        this.fetchPhoto(),
                      );


                    }}
                  >Delete</Button>
                  {/* display button   */}

                  <CardContent>
                    <Typography>
                      Posted on {item.date_time}
                    </Typography>
                    <Typography variant="h6">Comments</Typography>

                    {/* comments */}

                    {(item.comments) ? item.comments.map(thisComment => {

                      return (

                        <div key={thisComment._id}>

                          <ListItem>
                            <ListItemText
                              primary={thisComment.comment}
                              secondary={thisComment.date_time}>

                            </ListItemText>
                            {/* {thisComment.comment.comment}
                        {thisComment.comment.date_time} */}
                            <ListItem button component={Link} to={"/users/" + thisComment.user._id} />
                            <ListItem><Typography>{thisComment.user.first_name}</Typography></ListItem>
                            <ListItem>
                              <Button variant='contained' color='secondary'
                                onClick={() => {
                                  console.log('thisComment', thisComment);
                                  console.log('photo id check, ', item._id);
                                  let obj = { photo_id: item._id, comment_id: thisComment._id, user_id: thisComment.user._id }

                                  //delete a coment 
                                  axios.post('/deleteComment', obj).then(response => {

                                  }).then(
                                   
                                    this.fetchPhoto(),
                                  );



                                }}

                              >DELETE COMMENT</Button></ListItem>
                          </ListItem>

                        </div>
                      );
                    }) : console.log("no comments")}

                    {/* add new comment */}
                    <TextField
                      variant="outlined"
                      required
                      fullWidth
                      name="New Comment"
                      label="Add a comment"
                      type="New Comment"
                      id="New Comment"
                      autoComplete="New Comment"
                      onChange={(e) => { this.setState({ newComment: e.target.value }) }}



                    />
                    <Button
                      type="submit"
                      fullWidth variant="contained"
                      color="primary"
                      onClick={(e) => {
                        e.preventDefault();

                        let url = '/commentsOfPhoto/' + item._id;
                        console.log(url);
                        console.log(this.state);
                        let newComment = this.state.newComment;
                        console.log("type check", typeof newComment);


                        axios.post(url, { comment: newComment }).then(response => {
                          console.log("comment response ", response);

                        }).then(
                          this.fetchPhoto(),
                        )

                          .catch(err => {
                            console.log("comment  err ", err);
                          })




                      }}

                    >
                      Submit
          </Button>

                    {/* comments */}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>


      );
    }
  }
}

export default UserPhotos;
