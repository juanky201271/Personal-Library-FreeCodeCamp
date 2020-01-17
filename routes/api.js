/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';

var expect = require('chai').expect;
var ObjectId = require('mongodb').ObjectId;


module.exports = function (app, db) {

  app.route('/api/books')
    .get(function (req, res){
      //response will be array of book objects
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
      db.collection('books').aggregate([
        { $lookup:
           {
             from: 'comments',
             localField: '_id',
             foreignField: 'bookid',
             as: 'comments'
           }
         }
        ,
           {
              $project: {
                 title: 1,
                 commentcount: { $cond: { if: { $isArray: "$comments" }, then: { $size: "$comments" }, else: "0"} }
              }
           }
        ]).toArray((err, doc) => {
          if(err) {
            res.json('could not find ');
          } else {
            res.json(doc);
          }
      });
    })
    
    .post(function (req, res){
      var title = req.body.title;
      //response will contain new book object including atleast _id and title
      var j = {title: title};
      db.collection('books').insertOne(j, (err, doc) => {
            if(err) {
                res.json('could not add');
            } else {
                res.json(j);
            }
        }
      );
    })
    
    .delete(function(req, res){
      //if successful response will be 'complete delete successful'
      
        db.collection('books').findOneAndDelete({}, (err, doc) => {
              if(err || doc === null) {
                  res.json('could not complete delete - books');
              } else {
                db.collection('comments').findOneAndDelete({}, (err, doc) => {
                      if(err || doc === null) {
                          res.json('could not complete delete - comments');
                      } else {
                          res.json('complete delete successful');
                      }
                    }
                  );
              }
            }
          );

    });



  app.route('/api/books/:id')
    .get(function (req, res){
      var bookid = req.params.id;
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
      db.collection('books').find({_id: ObjectId(bookid)}).toArray((err, doc) => {
          if(err) {
            res.json('could not find ');
          } else {

              db.collection('comments').find({bookid: ObjectId(bookid)}).toArray((err, doc2) => {
                  if(err) {
                    res.json('could not find ');
                  } else {
                    res.json({_id: ObjectId(bookid), title: doc[0].title, comments: doc2});
                  }
              });
              
          }
      });
    })
    
    .post(function(req, res){
      var bookid = req.params.id;
      var comment = req.body.comment;
      //json res format same as .get
      var j = {bookid: ObjectId(bookid), comment: comment};
      db.collection('comments').insertOne(j, (err, doc) => {
            if(err) {
                res.json('could not add');
            } else {
              
                db.collection('books').find({_id: ObjectId(bookid)}).toArray((err, doc2) => {
                    if(err) {
                      res.json('could not find ');
                    } else {

                        db.collection('comments').find({bookid: ObjectId(bookid)}).toArray((err, doc3) => {
                            if(err) {
                              res.json('could not find ');
                            } else {
                              res.json({_id: ObjectId(bookid), title: doc2[0].title, comments: doc3});
                            }
                        });

                    }
                });  
              
            }
        }
      );
    })
    
    .delete(function(req, res){
      var bookid = req.params.id;
      //if successful response will be 'delete successful'
    
      db.collection('books').findOneAndDelete({_id: ObjectId(bookid)}, (err, doc) => {
          if(err || doc === null) {
              res.json('could not delete - books');
          } else {
            db.collection('comments').findOneAndDelete({bookid: ObjectId(bookid)}, (err, doc) => {
                  if(err || doc === null) {
                      res.json('could not delete - comments');
                  } else {
                      res.json('delete successful');
                  }
                }
              );
          }
        }
      );
    
    });
  
};
