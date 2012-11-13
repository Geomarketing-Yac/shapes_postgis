/* global require console process it describe after before JSON */

// these tests are for a user, but not one with admin privs

var should = require('should')

var request = require('request');
var _ = require('lodash');
var sgg = require('../lib/shape_geojson_generation')
var shape_service = sgg.shape_service;
var http = require('http')
var express = require('express')
var async = require('async')

var env = process.env;
var puser = process.env.PSQL_USER ;
var ppass = process.env.PSQL_PASS ;
var phost = process.env.PSQL_HOST ;
var pport = process.env.PSQL_PORT || 5432;


var testhost = env.SHAPES_TEST_HOST || '127.0.0.1'
var testport = env.SHAPES_TEST_PORT || 3000

var geom_utils = require('geom_utils')

describe ('shape_service', function(){

    describe('points db table', function(){
        var app,server;

        before(
            function(done){
                app = express()

                app.get('/points/:zoom/:column/:row.:format'
                       ,shape_service({'db':'osm'
                                      ,'table':'newtbmap.tvd'
                                      ,'alias':'tvd'
                                      ,'host':phost
                                      ,'username':puser
                                      ,'password':ppass
                                      ,'port':pport
                                      ,'select_properties':{'tvd.freeway_id' : 'freeway'
                                                           ,'tvd.freeway_dir': 'direction'
                                                           ,"'vdsid_' || id"   : 'detector_id'
                                                           ,'vdstype'        : 'type'
                                                           }
                                      ,'id_col':'detector_id'
                                      })
                       )
                server=http
                       .createServer(app)
                       .listen(testport,done)

            })
        after(function(done){
            server.close(done)
        })

        it('should produce vds points in a box'
          ,function(done){
               // load the service for vds shape data
               request({//url:'http://'+ testhost +':'+testport+'/points/11/354/820.json'
                   url:'http://'+ testhost +':'+testport+'/points/15/5653/13125.json'
                       ,'headers':{'accept':'application/json'}
                       ,followRedirect:true}
                      ,function(e,r,b){
                           if(e) return done(e)
                           r.statusCode.should.equal(200)
                           should.exist(b)
                           var c = JSON.parse(b)
                           c.should.have.property('type','FeatureCollection')
                           c.should.have.property('features')
                           c.features.should.have.length(16)
                           _.each(c.features
                                 ,function(member){
                                      member.should.have.property('geometry')
                                      member.should.have.property('properties')
                                      member.properties.should.have.property('id')
                                  })
                           return done()
                       })
           })
    })
    describe('lines db table',function(){
        var app,server;

        before(
            function(done){
                app = express()

                app.get('/lines/:zoom/:column/:row.:format'
                       ,shape_service({'db':'spatialvds'
                                      ,'table':'tempseg.mostusedroadbits'
                                      ,'alias':'murb'
                                      ,'host':phost
                                      ,'username':puser
                                      ,'password':ppass
                                      ,'port':pport
                                      ,'select_properties':{'murb.refnum' : 'freeway'
                                                           ,'murb.direction': 'direction'
                                                           ,"detector_id"   : 'detector_id'
                                                           ,'components'    : 'components'
                                                           ,'year'          : 'year'
                                                           }
                                      ,'id_col':['detector_id','direction','year']
                                      ,'geo_col':'seggeom'
                                      })
                       )
                server=http
                       .createServer(app)
                       .listen(testport,done)

            })
        after(function(done){
            server.close(done)
        })

        it('should get lines for freeways in a box'
          ,function(done){
               // load the service for vds shape data
               request({//url:'http://'+ testhost +':'+testport+'/lines/11/354/820.json'
                   url:'http://'+ testhost +':'+testport+'/lines/15/5653/13125.json'
                       ,'headers':{'accept':'application/json'}
                       ,followRedirect:true}
                      ,function(e,r,b){
                           if(e) return done(e)
                           r.statusCode.should.equal(200)
                           should.exist(b)
                           var c = JSON.parse(b)
                           c.should.have.property('type','FeatureCollection')
                           c.should.have.property('features')
                           c.features.should.have.length(33)
                           _.each(c.features
                                 ,function(member){
                                      member.should.have.property('geometry')
                                      member.should.have.property('properties')
                                      member.properties.should.have.property('id')
                                  })
                           return done()
                       })
           })
    })
    describe('areas db table',function(){
        var app,server;

        before(
            function(done){
                app = express()

                var shape_handler = shape_service({'db':'spatialvds'
                                      ,'table':'public.carb_counties_aligned_03'
                                      ,'alias':'counties'
                                      ,'host':phost
                                      ,'username':puser
                                      ,'password':ppass
                                      ,'port':pport
                                      ,'select_properties':{'gid'           : 'gid'
                                                           ,'a.fips'         :'fips'
                                                           ,'cacoa_'       : 'cacoa_'
                                                           ,'cacoa_id'     : 'id'
                                                           ,'coname'       : 'coname'
                                                           ,'a.name'         : 'name'
                                                           ,'conum'        : 'conum'
                                                           ,'display'      : 'display'
                                                           ,'symbol'       : 'symbol'
                                                           ,'islandname'   : 'islandname'
                                                           ,'baysplinte'   : 'baysplinte'
                                                           ,'cntyi_area'   : 'cntyi_area'
                                                           ,'island_id'    : 'island_id'
                                                           ,'bay_id'       : 'bay_id'
                                                           }
                                      ,'id_col':['fips','gid']
                                      ,'geo_col':'geom4326'
                                      ,'join_tables':[{'table':'counties_fips'
                                                      ,'alias':'a'
                                                      ,'join' :'on (counties.name ~* a.name)'}
                                                     ]
                                      })
                app.get('/areas/:zoom/:column/:row.:format'
                       ,shape_handler
                       )
                app.get('/areas.:format'
                       ,shape_handler)

                server=http
                       .createServer(app)
                       .listen(testport,done)

            })
        after(function(done){
            server.close(done)
        })

        it('should get polygons for counties in a box'
          ,function(done){
               // load the service for vds shape data
               request({//url:'http://'+ testhost +':'+testport+'/areas/11/354/820.json'
                   url:'http://'+ testhost +':'+testport+'/areas/11/353/820.json'
                       ,'headers':{'accept':'application/json'}
                       ,followRedirect:true}
                      ,function(e,r,b){
                           if(e) return done(e)
                           r.statusCode.should.equal(200)
                           should.exist(b)
                           var c = JSON.parse(b)
                           c.should.have.property('type','FeatureCollection')
                           c.should.have.property('features')
                           c.features.should.have.length(1)
                           _.each(c.features
                                 ,function(member){
                                      member.should.have.property('geometry')
                                      member.should.have.property('properties')
                                      member.properties.should.have.property('id')
                                  })
                           return done()
                       })
           })
        it('should get all the counties when there is no box'
          ,function(done){
               // load the service for vds shape data
               request({//url:'http://'+ testhost +':'+testport+'/areas/11/354/820.json'
                   url:'http://'+ testhost +':'+testport+'/areas.json'
                       ,'headers':{'accept':'application/json'}
                       ,followRedirect:true}
                      ,function(e,r,b){
                           if(e) return done(e)
                           r.statusCode.should.equal(200)
                           should.exist(b)
                           var c = JSON.parse(b)
                           c.should.have.property('type','FeatureCollection')
                           c.should.have.property('features')
                           // use greater than, because of islands and such
                           c.features.should.have.length(95)
                           var fipscheck  = geom_utils.fips_lookup()
                           _.each(c.features
                                 ,function(member){
                                      member.should.have.property('geometry')
                                      member.should.have.property('properties')
                                      member.properties.should.have.property('id')
                                      member.properties.should.have.property('fips')
                                      if(fipscheck[member.properties.fips]){
                                          delete fipscheck[member.properties.fips];
                                      }
                                  });
                           _.keys(fipscheck).should.be.empty
                           return done()
                       })
           })
    })
    describe('two points tables', function(){
        var app,server;

        before(
            function(done){
                app = express()

                var vds_options={'db':'osm'
                                ,'table':'newtbmap.tvd'
                                ,'alias':'tvd'
                                ,'host':phost
                                ,'username':puser
                                ,'password':ppass
                                ,'port':pport
                                ,'select_properties':{'tvd.freeway_id' : 'freeway'
                                                     ,'tvd.freeway_dir': 'direction'
                                                     ,"'vdsid_' || id"   : 'detector_id'
                                                     ,'vdstype'        : 'type'
                                                     }
                                ,'id_col':'detector_id'
                                }
                var wim_options={'db':'osm'
                                ,'table':'osm_upgraded_2010.twim'
                                ,'alias':'twim'
                                ,'host':phost
                                ,'username':puser
                                ,'password':ppass
                                ,'port':pport
                                ,'select_properties':{'twim.freeway_id' : 'freeway'
                                                     ,'twim.direction': 'direction'
                                                     ,"'wimid_' || site_no"   : 'detector_id'
                                                     ,'wim_type'        : 'type'
                                                     }
                                ,'id_col':['detector_id','direction']
                                }

                // now chain the services with callbacks

                var chained_service = function(req,res,next){
                    async.parallel([function(cb){
                                        shape_service(vds_options
                                                     ,function(data,req,res,next){
                                                          cb(null,data)
                                                      })(req,res,next)
                                    }
                                   ,function(cb){
                                        shape_service(wim_options
                                                     ,function(data,req,res,next){
                                                          cb(null,data)
                                                      })(req,res,next)
                                    }]
                                  ,function(err,results){

                                       var data = results[0]
                                       var wim = results[1]
                                       if(data && data.features === undefined){
                                           data = wim
                                       }else{
                                           if(wim
                                            && wim.features !== undefined
                                            && wim.features.length){
                                               data.features.push(wim.features)
                                               data.features = _.flatten(data.features)
                                           }
                                       }
                                       res.writeHead(200, { 'Content-Type': 'application/json' });
                                       res.end(JSON.stringify(data));
                                   })
                    return null
                }

                app.get('/points/:zoom/:column/:row.:format'
                       ,chained_service
                       )
                server=http
                       .createServer(app)
                       .listen(testport,done)

            })
        after(function(done){
            server.close(done)
        })

        it('should produce vds points in a box'
          ,function(done){
               // load the service for vds shape data
               request({url:'http://'+ testhost +':'+testport+'/points/14/2821/6558.json'
                       ,'headers':{'accept':'application/json'}
                       ,followRedirect:true}
                      ,function(e,r,b){
                           if(e) return done(e)
                           r.statusCode.should.equal(200)
                           should.exist(b)
                           var c = JSON.parse(b)
                           c.should.have.property('type','FeatureCollection')
                           c.should.have.property('features')
                           c.features.should.have.length(15)
                           var vds_match=false
                           var wim_match = false;
                           var vds_regex = /vdsid_\d{6,7}/;
                           var wim_regex = /wimid_\d+_[NSEW]/;
                           _.each(c.features
                                 ,function(member){
                                      member.should.have.property('geometry')
                                      member.should.have.property('properties')
                                      member.properties.should.have.property('id')
                                      if(vds_regex.test(member.properties.id))
                                          vds_match = true
                                      if(wim_regex.test(member.properties.id))
                                          wim_match = true
                                  });
                           vds_match.should.be.true
                           wim_match.should.be.true
                           return done()
                       })
           })
    })
})
