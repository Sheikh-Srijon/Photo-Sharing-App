"use strict";

/* jshint node: true */

/*
 * This builds on the webServer of previous projects in that it exports the current
 * directory via webserver listing on a hard code (see portno below) port. It also
 * establishes a connection to the MongoDB named 'cs142project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch any file accessible
 * to the current user in the current directory or any of its children.
 *
 * This webServer exports the following URLs:
 * /              -  Returns a text status message.  Good for testing web server running.
 * /test          - (Same as /test/info)
 * /test/info     -  Returns the SchemaInfo object from the database (JSON format).  Good
 *                   for testing database connectivity.
 * /test/counts   -  Returns the population counts of the cs142 collections in the database.
 *                   Format is a JSON object with properties being the collection name and
 *                   the values being the counts.
 *
 * The following URLs need to be changed to fetch there reply values from the database.
 * /user/list     -  Returns an array containing all the User objects from the database.
 *                   (JSON format)
 * /user/:id      -  Returns the User object with the _id of id. (JSON format).
 * /photosOfUser/:id' - Returns an array with all the photos of the User (id). Each photo
 *                      should have all the Comments on the Photo (JSON format)
 *
 */

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var fs = require('fs');
var async = require('async');

// Load the Mongoose schema for User, Photo, and SchemaInfo
var User = require('./schema/user.js');
var Photo = require('./schema/photo.js');
var SchemaInfo = require('./schema/schemaInfo.js');

//new for project 7: load the moondgoose schemas
const session = require('express-session');
const bodyParser = require('body-parser');
const multer = require('multer');
const processFormBody = multer({ storage: multer.memoryStorage() }).single('uploadedphoto');



//end
var express = require('express');
const { CollectionsBookmarkRounded, RepeatOneSharp } = require('@material-ui/icons');
const { responsiveFontSizes } = require('@material-ui/core');
var app = express();
app.use(session({ secret: 'secretKey', resave: false, saveUninitialized: false }));
app.use(bodyParser.json());

// XXX - Your submission should work without this line. Comment out or delete this line for tests and before submission!
//var cs142models = require('./modelData/photoApp.js').cs142models;

mongoose.connect('mongodb://localhost/cs142project6', { useNewUrlParser: true, useUnifiedTopology: true });

// We have the express static module (http://expressjs.com/en/starter/static-files.html) do all
// the work for us.
app.use(express.static(__dirname));


app.get('/', function (request, response) {
    response.send('Simple web server of files from ' + __dirname);
});

/*
 * Use express to handle argument passing in the URL.  This .get will cause express
 * To accept URLs with /test/<something> and return the something in request.params.p1
 * If implement the get as follows:
 * /test or /test/info - Return the SchemaInfo object of the database in JSON format. This
 *                       is good for testing connectivity with  MongoDB.
 * /test/counts - Return an object with the counts of the different collections in JSON format
 */
app.get('/test/:p1', function (request, response) {
    // Express parses the ":p1" from the URL and returns it in the request.params objects.
    console.log('/test called with param1 = ', request.params.p1);

    var param = request.params.p1 || 'info';

    if (param === 'info') {
        // Fetch the SchemaInfo. There should only one of them. The query of {} will match it.
        SchemaInfo.find({}, function (err, info) {
            if (err) {
                // Query returned an error.  We pass it back to the browser with an Internal Service
                // Error (500) error code.
                console.error('Doing /user/info error:', err);
                response.status(500).send(JSON.stringify(err));
                return;
            }
            if (info.length === 0) {
                // Query didn't return an error but didn't find the SchemaInfo object - This
                // is also an internal error return.
                response.status(500).send('Missing SchemaInfo');
                return;
            }

            // We got the object - return it in JSON format.
            console.log('SchemaInfo', info[0]);
            response.end(JSON.stringify(info[0]));
        });
    } else if (param === 'counts') {
        // In order to return the counts of all the collections we need to do an async
        // call to each collections. That is tricky to do so we use the async package
        // do the work.  We put the collections into array and use async.each to
        // do each .count() query.
        var collections = [
            { name: 'user', collection: User },
            { name: 'photo', collection: Photo },
            { name: 'schemaInfo', collection: SchemaInfo }
        ];
        async.each(collections, function (col, done_callback) {
            col.collection.countDocuments({}, function (err, count) {
                col.count = count;
                done_callback(err);
            });
        }, function (err) {
            if (err) {
                response.status(500).send(JSON.stringify(err));
            } else {
                var obj = {};
                for (var i = 0; i < collections.length; i++) {
                    obj[collections[i].name] = collections[i].count;
                }
                response.end(JSON.stringify(obj));

            }
        });
    } else {
        // If we know understand the parameter we return a (Bad Parameter) (400) status.
        response.status(400).send('Bad param ' + param);
    }
});

/*
 * URL /user/list - Return all the User object.
 */
app.post('/admin/login', function (request, response) {
    // console.log("request in ws ", request);
    let login_name = request.body.login_name;
    let password = request.body.password;

    User.findOne({ 'login_name': login_name }, function (err, user) {
        if (err) {
            // console.log("err in admin/login");
            response.status(200).send(JSON.stringify(err));
            return;
        }
        else if (user === null) {
            // console.log("user not found in db");
            response.status(400).send("user not found");
            return;
        }
        else {

            // console.log("user is ", user);
            request.session.user = user;
            request.session.login_name = user.login_name;
            request.session.user_id = request.session.user._id; // ??? check if the property is user_id or _id?
            response.status(200).send(user);
        }
    });
})
//for log outs 
app.post('/admin/logout', function (request, response) {
    request.session.destroy((err) => {
        if (err) {
            console.log('post err');
            response.status(401).send(); return;
        }
        else {
            // console.log("logged out");
            console.log('logout success');

            response.status(200).send('success'); return;
        }
    });
});
//for retrieving user list
app.get('/user/list', function (request, response) {
    //response.status(200).send(cs142models.userListModel());

    //my mongoose code 
    User.find({}, function (error, docs) {
        if (error) {
            response.status(500).send(JSON.stringify(error));
            // console.log("error in userlist");
            return;
        }
        else {
            let databaseUser = JSON.parse(JSON.stringify(docs));//usre is obtained
            //console.log("dbUser test," , databaseUser);
            var userList = [];
            databaseUser.forEach((item) => {
                var userObj = {};
                userObj._id = item._id;
                userObj.first_name = item.first_name;
                userObj.last_name = item.last_name;
                userList.push(userObj);
            })
            response.status(200).send(userList);
        }
    })
});



//to get session state 
app.get('/session', function (request, response) {
    if (request.session.user !== null && request.session.user !== undefined) {
        // console.log("/session user check ", request.session.user);
        response.status(200).send(request.session.user);
        return;
    }
    else {
        // console.log("err in webserver session");
        response.status(500).send("error in /session");
    } return;
})

app.post('/photos/new', function (request, response) {
    processFormBody(request, response, function (err) {
        if (err || !request.file) {
            // XXX -  Insert error handling code here.
            response.status(400).send("err in file uploading");
            // console.log("err in file uploading");
            return;
        }
        // request.file has the following properties of interest
        //      fieldname      - Should be 'uploadedphoto' since that is what we sent
        //      originalname:  - The name of the file the user uploaded
        //      mimetype:      - The mimetype of the image (e.g. 'image/jpeg',  'image/png')
        //      buffer:        - A node Buffer containing the contents of the file
        //      size:          - The size of the file in bytes

        // XXX - Do some validation here.
        // We need to create the file in the directory "images" under an unique name. We make
        // the original file name unique by adding a unique prefix with a timestamp.
        const timestamp = new Date().valueOf();
        const filename = 'U' + String(timestamp) + request.file.originalname;

        fs.writeFile("./images/" + filename, request.file.buffer, function (err) {
            // XXX - Once you have the file written into your images directory under the name
            // filename you can create the Photo object in the database
            if (err) {
                response.status(400).send("Could not write the file");
                // console.log("could not write the file");
                return;
            }
            else {
                var myFile = {};
                myFile.file_name = filename;
                myFile.user_id = request.session.user._id;
                // console.log("check session copy of userid", request.session.user._id);

                Photo.create(myFile, function (err, photo) {
                    if (err) {
                        response.status(400).send("err in MongoDB");
                        return;
                    }
                    else {
                        photo.id = photo._id;
                        photo.save();
                        // console.log("success create photo", photo._id);
                        response.status(200).send(photo);
                    }
                })
            }
        });
    });

})

/*
 * URL /user/:id - Return the information for User (id)
 */
app.get('/user/:id', function (request, response) {
    var id = request.params.id;

    User.find({ '_id': id }, function (err, docs) {
        if (err) {
            response.status(400).send(JSON.stringify(err));
            return;
        }
        else if (docs.length === 0) {
            // console.log("We could not find your user!");
            response.status(400).send('NOT FOUND');
            return;

        }
        else {
            var databaseUser = JSON.parse(JSON.stringify(docs[0]));
            var c = 0;


            delete databaseUser.__v;
            response.status(200).send(databaseUser);
            return;
        }
    })
    // response.status(200).send(user);
});

//expect userId
app.post('/deleteUser/', function (request, response) {
    if (request.body.user_id === null || request.body.user_id === undefined) {
        response.status(400).send('not userid');
        return;
    }

    if (request.body.user_id !== request.session.user._id) {
        response.status(400).send('invalid user ');
        return;
    }

    else {
        console.log('inside delete user');
        //delete all his photos 
        // Photo.remove({'user_id': request.body.user_id}); //remove all documents of collection Photo with this uer_id
        Photo.find({ 'user_id': request.session.user._id }).remove().exec(function (err) {
            if (err) { console.log(err); }
        });

        User.findOneAndDelete({ '_id': request.body.user_id }, function (err) {
            if (err) {
                console.log('couldnt delete user');
                response.status(400).send('couldnt delete user');
                return;
            }
        });
        // delete any comments they have made 

        var query = Photo.find({});
        query.select("comments").exec(function (err, result) {
            if (err) {
                response.status(400).send(err);
                return;
            }
            if (result.length === 0) {
                response.status(400).send('err');
                return;
            }
            else {
                var dbPhotos = JSON.parse(JSON.stringify(result));

                async.each(dbPhotos, function (thisPhoto, photoCallback) {

                    // thisPhoto.comments.deleteMany({ 'user_id': request.session.user_id });
                    // async.each(thisPhoto.comments,
                    //     function (thisComment, commentCallback) {
                    //         if (thisComment.user_id === request.session.user_id) {
                    //             console.log(thisComment);
                                
                    //             commentCallback();
                    //         }
                    //     },
                    //     function (err) {
                    //         if (err) {
                    //             console.log('photo callback err');
                    //             response.status(400).send('photo callback error');
                    //             return;
                    //         }
                    //         else {
                    //             photoCallback();
                    //         }
                    //     }

                    // ); //ends inner async

                    var copy = thisPhoto.comments.filter(item => {item.user_id !== request.session.user_id});
                    console.log('before copy ', thisPhoto.comments);
                    thisPhoto.comments = copy;
                    
                    console.log('after copy ', thisPhoto.comments);
                    // photoCallback();
                }, //2nd arg of outer ends 
                    function (err) {
                        if (err) {
                            console.log('photo callback err');
                            response.status(400).send('photo callback error');
                            return;
                        }
                        else {
                            console.log('all photos processed');
                            response.status(200).send('success');
                            return;
                        }
                    } //third argument of outer ends

                );//outer async ends
            }//query -- else ends
        });

}
});



//comments post s
app.post('/commentsOfPhoto/:photo_id', function (request, response) {
    // console.log("comment request ", request.body);
    let new_comment = request.body.comment;
    if (request.session === undefined || request.session.username === null) {
        response.status(401).send("No such user logged in");
        return;
    }
    else {
        let photo_id = request.params.photo_id;
        Photo.findOne({ '_id': photo_id }, function (err, photo) {
            if (err) {
                // console.log("err in comment ws");
                response.status(401).send("Photo error");
                return;
            }
            else if (photo === null) {
                response.status(401).send("Photo not found");
                return;
            }
            else if (new_comment === "" || new_comment === undefined) {
                response.status(400).send("No comment in request");
            }
            else {
                // let commentArray = photo.comments; 
                let final_comment = { comment: new_comment, user_id: request.session.user_id };

                photo.comments.push(final_comment);
                photo.save(photo.comments);
                // console.log("photo comments test", photo);


            }
        })
    }
})

app.post('/user', function (request, response) {
    if (request.body.login_name === undefined || request.body.login_name === "") {
        response.status(400).send("no login name");
        return;
    }
    if (request.body.password === undefined || request.body.password === "") {
        response.status(400).send("no login password");
        return;
    }



    if (request.body.first_name === undefined || request.body.first_name === "") {
        response.status(400).send("no firstname");
        return;
    }
    if (request.body.last_name === undefined || request.body.last_name === "") {
        response.status(400).send("no lastname");
        return;
    }
    else {
        //check uniqueness of this user
        User.findOne({ 'login_name': request.body.login_name }, function (err, res) {
            if (err) {
                response.status(400).send("error mongdb");
                return;
            }
            else if (res) {
                response.status(400).send("Alrady registered user");
                return;
            }
            else {
                //new user should be added to database
                var newUser = {};
                newUser.login_name = request.body.login_name;
                newUser.password = request.body.password;
                newUser.first_name = request.body.first_name;
                newUser.last_name = request.body.last_name;
                newUser.occupation = request.body.occupation;
                newUser.location = request.body.location;
                newUser.description == request.body.description;

                User.create(newUser, function (err, res) {
                    if (err) {
                        response.status(400).send("could not create new user");
                        return;
                    }
                    else {
                        res.id = res._id;
                        res.save();
                        request.session.login_name = res.login_name;
                        request.session.user = res;
                        // console.log("new user is ", res);
                        response.status(200).send(res);
                    }
                })
            }
        })
    }

})

/*
 * URL /photosOfUser/:id - Return the Photos for User (id)
 */
app.get('/photosOfUser/:id', function (request, response) {
    var id = request.params.id;
    //var photos = cs142models.photoOfUserModel(id);
    var query = Photo.find({ 'user_id': id });
    var dbPhotos = {};
    query.select("_id user_id comments file_name date_time numLikes").exec(function (err, result) {
        if (err) {
            response.status(400).send("Not found");
            return;
        }
        if (result.length === 0) {
            response.status(400).send("Not Found");
            return;
        }
        else {
            dbPhotos = JSON.parse(JSON.stringify(result));


            async.each(dbPhotos, function (thisPhoto, photoCallback) {

                async.each(thisPhoto.comments, function (thisComment, commentCallback) {

                    // console.log("this comment number", thisComment.user_id);
                    var userQuery = User.findOne({ '_id': thisComment.user_id });
                    userQuery.select("first_name last_name").exec(function (err, user) {
                        if (err) {
                            // console.log("err in user comment");
                            response.status(400).send("Not found");

                            return;
                        }
                        if (!user) {
                            // console.log("err in user comment");
                            response.status(400).send("no such user");
                            return;
                        }
                        else {
                            var commentByUser = JSON.parse(JSON.stringify(user));
                            // console.log("comment by", commentByUser);
                            thisComment.user = commentByUser;//add this user object to this comment
                            delete thisComment.user.__v;
                            delete thisComment.user_id;
                            // console.log("processed comment -- ", thisComment.comment);
                            commentCallback();
                        }

                    });

                    // console.log("dbPhotos aftre async block", dbPhotos);

                },
                    function (err) {
                        // console.log("rreporting from comment async callabck, SIR");
                        if (err) {
                            // console.log("comment error");
                            response.status(200).send("comment error");
                            return;
                        } else {
                            photoCallback();
                            // console.log("comment success");
                        }


                    })
            },
                function (err) {
                    if (err) {
                        response.status(200).send("photo error");

                        // console.log("photos error");
                        return;
                    }
                    else {
                        // console.log("photos success");
                        response.status(200).send(dbPhotos);
                        return;
                    }
                })
        }

    });



});

//expecting request object to have 
/** delta: +1 or -1 
 * photo_id
*/

app.post('/like/', function (request, response) {

    // console.log(typeof request.body.delta);

    // if (request.body.delta !== 1 && request.body.delta !== -1) {
    //     response.status(200).send("No like change detected");
    //     return;
    // }
    if (request.body.photo_id === undefined || request.body.photo_id === null) {
        response.status(200).send("No photo id");
        return;
    }
    if (request.body.user_id === undefined || request.body.user_id === null) {
        response.status(200).send("no user id");
        return;
    }

    else {
        // var increment = request.body.delta;


        //update like count of this photo
        Photo.findOne({ '_id': request.body.photo_id }, function (err, photo) {

            if (err) {
                response.status(400).send("Photo was not found while like");
                return;
            }
            else if (photo === null) {
                response.status(401).send("Photo not found"); return;
            }
            else {
                // console.log('photo was found ', photo.numLikes);
                //modify likes 
                if (photo.numLikes === undefined) {
                    photo.numLikes = 0;
                }
                if (photo.user_liked.includes(request.body.user_id)) {
                    // console.log('before photo ', photo);

                    photo.numLikes -= 1;
                    if (photo.numLikes < 0) {
                        photo.numLikes = 0;
                    }
                    //if user liked before and presses button again, unlike it 
                    photo.user_liked = photo.user_liked.filter((elem) => { return elem != request.body.user_id });
                    photo.save();
                    // console.log('after photo ', photo);
                    let obj = [photo.numLikes.toString(), 'LIKE'];
                    response.status(200).send(obj);
                    return;
                }
                else {
                    //has not liked before and clicked button
                    // console.log('before photo ', photo);

                    photo.numLikes += 1;
                    photo.user_liked.push(request.body.user_id);
                    photo.save();
                    console.log('after photo ', photo);

                    // console.log('photo test ', photo.numLikes);
                    let obj = [photo.numLikes.toString(), 'UNLIKE'];
                    response.status(200).send(obj);
                    return;

                }

            }
        })



    }
});

//request must send photo_id, comment_id and user id
app.post('/deleteComment', function (request, response) {

    console.log('comment req ', request.body.comment_id);
    if (request.body.comment_id === undefined || request.body.comment_id === null) {
        response.status(400).send("comment error");
        return;
    }
    if (request.body.photo_id === undefined || request.body.photo_id === null) {
        response.status(400).send("No photo id");
        return;
    }
    // if(request.body.user_id !== request.session.user._id){
    //     response.status(400).send('comment error');
    //     return;
    // }
    else {
        //find photo find comment 
        Photo.findOne({ '_id': request.body.photo_id }, function (err, photo) {
            //should have photo here 

            console.log(' photo from delete comment ', photo.comments);
            //

            var copy = photo.comments;
            var copy2 = copy.filter(item => { return item._id.toString() !== request.body.comment_id.toString() })
            console.log('copy 2', copy2);
            photo.comments = copy2;
            photo.save();
            // console.log('test if deletion worked ', photo.comments);

        });
        response.status(200).send('success');

    }

});

// request must send photoID userID

app.post('/deletePhoto/', function (request, response) {
    // console.log('inside delete photo');
    // console.log(request.body);
    // console.log('session.user_id test ', request.session.user);
    if (request.body.photo_id === undefined || request.body.photo_id === null) {
        response.status(400).send("No photo id");
        return;
    }
    //validate 
    if (request.body.user_id !== request.session.user._id) {
        response.status(400).send("User does not own this photo");
        return;
    }
    else {
        console.log('before ', Photo);
        Photo.findOneAndDelete({ '_id': request.body.photo_id }, function (err) {
            if (err) {
                console.log(err);
                response.status(400).send('photo couldnt be deleted');
                return;
            } else {
                response.status(200).send('success');
            }
        });
        console.log('after ', Photo);



    }
})

app.get('/recentPhoto/:id', function (request, response) {
    //retrieve id 
    var id = request.params.id;
    //query in database 
    var query = Photo.find({ 'user_id': id });
    var dbPhotos = {};
    query.select("_id user_id date_time comments file_name numLikes user_liked").exec(function (err, result) {
        if (err) {
            response.status(400).send("photo not found");
            return;
        }
        else if (result.length === 0) {
            response.status(400).send("result array empty");
            return;
        }
        else {
            dbPhotos = JSON.parse(JSON.stringify(result));
            //  console.log('before ', dbPhotos );
            let dateString = dbPhotos[0].date_time;
            let dateObject = new Date(dateString);
            dbPhotos.sort((a, b) => {

                let date1 = new Date(a.date_time);
                let date2 = new Date(b.date_time);

                return date2 - date1;//latest photo first
            });
            // console.log(dbPhotos);
            console.log('sorted ', dbPhotos);
            response.status(200).send(dbPhotos[0]);
            return;

        }

    })
    //store appropriate parameters

});

// highest commented photo GET req
app.get('/mostComments/:id', function (request, response) {
    //retrieve id 
    var id = request.params.id;
    //query in database 
    var query = Photo.find({ 'user_id': id });
    var dbPhotos = {};
    query.select("_id user_id date_time comments file_name").exec(function (err, result) {
        if (err) {
            response.status(400).send("photo not found");
            return;
        }
        else if (result.length === 0) {
            response.status(400).send("result array empty");
            return;
        }
        else {
            dbPhotos = JSON.parse(JSON.stringify(result));
            //  console.log('before ', dbPhotos );
            let dateString = dbPhotos[0].date_time;
            let dateObject = new Date(dateString);
            dbPhotos.sort((a, b) => {
                b.comments.length - a.comments.length;

            });

            //  console.log('sorted ', dbPhotos);
            //    console.log('comment check ', dbPhotos);
            response.status(200).send(dbPhotos[0]);
            return;

        }

    })

});


var server = app.listen(3000, function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});


