$(document).ready(function(){

    console.log("document ready");

    /* -----------------------------------
      initialize for viewport
    ----------------------------------- */
    // for map
    mapWidth = $("#wrap").width();
    mapHeight = $("#wrap").height() - $("#headerArea").height();

    // for timeline
    minimunTimeHeight = 100; //map表示時のtimelineの高さ
    margin = {top: 30, right: 60, bottom: 0, left: 80};
    timeWidth = $("#wrap").width() - $("#infoDetailArea").outerWidth();
    //var timeHeight = minimunTimeHeight;
    timeHeight = $("#wrap").height() - $("#headerArea").height();


    /* ---------------
    Event Listener System
    --------------- */
    var Eventer=function(){if(!(this instanceof Eventer))return new Eventer;this.publish=function(c,d){topics=b(c),topics.forEach(function(b){"object"==typeof a[b]&&a[b].forEach(function(a){a.apply(this,d||[])})})},this.subscribe=function(b,c){var d=[].concat(c);return d.forEach(function(c){a[b]||(a[b]=[]),a[b].push(c)}),[b,c]},this.unsubscribe=function(b,c){a[b]&&a[b].forEach(function(d,e){d==c&&a[b].splice(e,1)})},this.queue=function(){return a},this.on=this.subscribe,this.off=this.unsubscribe,this.trigger=this.publish;var a={},b=function(a){return"string"==typeof a?a.split(" "):a};return this};



    /* -----------------------------------
      date parser
    ----------------------------------- */
    var yearParser = d3.time.format("%Y");
    var monthParser = d3.time.format("%m");
    var dayParser = d3.time.format("%d");
    var timeParser = d3.time.format("%H:%M:%S");
    var dateFullParser = d3.time.format("%H:%M:%S:%L").parse;
    var parseDate = d3.time.format("%Y%m%d%H%M%S%L").parse;

    /* -----------------------------------
      initialize
    ----------------------------------- */
    /*  data id */ var dataId = 0, dataIdPrev = -1;
    /* data */ var ParsedDataSelected = new Array(), parsedData;
    /* trim date */ var selectedStartDate, selectedEndDate;
    /*  timer */ var interval = 4000, animBool = true, loopAnimId;
    /*  menu */ var menuNum = 4;
    /* circles */ var mapCircles, timelineCircles, dotsSize = 4;
    /* menu for timeline */ var periodPrime = new Array();
    /* view mode */ var viewMode = "map";
    var conAxis;



    /* -----------------------------------
      scale
    ----------------------------------- */
    console.log("--- first scaled ---");
    console.log("timeWidth", timeWidth);
    console.log("timeHeight", timeHeight);
    xScale = d3.time.scale().range([0, timeWidth - margin.left - margin.right]);
    // var yScale = d3.scale.linear().range([0, minimunTimeHeight]);
    // var yScaleForAxis = d3.time.scale().range([0, minimunTimeHeight]);
    yScale = d3.scale.linear().range([0, timeHeight]);
    yScaleForAxis = d3.time.scale().range([0, timeHeight]);



    /* -----------------------------------
      initialize map functions
    ----------------------------------- */
    var map = L.map('mapDiv').setView([35.689488, 139.691706], 10);
    mapLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';

    L.tileLayer(
        'http://{s}.www.toolserver.org/tiles/bw-mapnik/{z}/{x}/{y}.png', {
        attribution: '&copy; ' + mapLink + ' Contributors',
        maxZoom: 18,
    }).addTo(map);

    map._initPathRoot();



    /* -----------------------------------
      viewport
    ----------------------------------- */
    d3.select("#mapArea").attr("width", mapWidth);
    d3.select("#mapArea").attr("height", mapHeight);
    d3.select("#mapDiv").attr("width", mapWidth);
    d3.select("#mapDiv").attr("height", mapHeight);

    var mapContainer = d3.select("#mapDiv").select("svg").append("g")
        .attr("width", mapWidth)
        .attr("height", mapHeight)
        .attr("viewBox", "0 0 "+ mapWidth + " " + mapHeight)
        .attr("preserveAspectRatio", "xMidYMid")
        .attr("id", "chartMap")
      .append("g");
        // .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var timeContainer = d3.select("#timelineDiv").append("svg")
        .attr("width", timeWidth)
        .attr("height", timeHeight)
        .attr("viewBox", "0 0 "+ timeWidth + " " + timeHeight)
        .attr("preserveAspectRatio", "xMidYMid")
        .attr("id", "chartTimeline")
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var mainCircleContainer = timeContainer.append("g").attr("id", "mainCircleContainer"); //timeline表示
    var axisContainer = timeContainer.append("g").attr("id", "axisContainer"); //軸表示エリア



    var Chart = function() {

  	    var self = this;
  	    this.e = new Eventer;

  	    this.init = function() {
  	        this.e.subscribe('load:data', [this.getData] );

            this.e.subscribe('draw:mapcircle', [this.drawMapCircle] );
            this.e.subscribe('draw:timelinecircle', [this.drawTimelineCircle] );
            this.e.subscribe('draw:periodmenu', [this.drawPeriodMenu] );
            this.e.subscribe('draw:axis', [this.drawAxis] );

            this.e.subscribe('update:mainloop', [this.updateMainLoop] );
            this.e.subscribe('update:map2timeline', [this.updateMap2Timeline] );
            this.e.subscribe('update:timeline2map', [this.updateTimeline2Map] );

            this.e.subscribe('update:mapCircle', [this.updateMapCircle] );
            this.e.subscribe('update:timelineCircle', [this.updateTimelineCircle] );
            this.e.subscribe('update:axis', [this.updateAxis] );

            this.e.subscribe('update:menu', [this.menuChange] );
            this.e.subscribe('update:detail', [this.updateDetail] );
            this.e.subscribe('resize:timeline', [this.resizeTimeline] );

  	        this.e.publish( 'load:data' );
  	    };


        this.getData = function() {

            queue()
              //.defer(d3.text, "../log/logs.txt")
              .defer(d3.text, "assets/data/logs.txt")
              .await(loadReady);

              function loadReady(_error, _newdata) {

                    parsedData = d3.tsv.parseRows(_newdata, function(d) {
                        return { location: d[0], input: d[1], output: d[2], settings: d[3], time: d[4] };
                    });

                    parsedData.forEach(function(d) {
                        if (d.location != "nodata") {
                            var _latlng = d.location.split(",");
                            d.LatLng = new L.LatLng(parseFloat(_latlng[0]), parseFloat(_latlng[1]));
                        } else {
                            d.LatLng = new L.LatLng(35.689488, 139.691706); //東京
                        };
                    });
                    parsedData.forEach(function(d) {
                      d.dateObj = parseDate(d.time);
                    });

                    ParsedDataSelected = $.extend(true, [], parsedData);

                    /* generate period */
                    var date_obj = new Date();

                    periodPrime[0] = {"name": "recent 3 days"};
                    periodPrime[1] = {"name": "recent 7 days"};
                    periodPrime[2] = {"name": "recent 30 days"};
                    periodPrime[3] = {"name": "recent 60 days"};
                    periodPrime[4] = {"name": "all days"};

                    periodPrime[0].startDate = d3.time.day.offset( new Date(), -3);
                    periodPrime[1].startDate = d3.time.day.offset( new Date(), -7);
                    periodPrime[2].startDate = d3.time.day.offset( new Date(), -30);
                    periodPrime[3].startDate = d3.time.day.offset( new Date(), -60);
                    periodPrime[4].startDate = parsedData[0].dateObj;

                    periodPrime[0].endDate = new Date( date_obj.getFullYear(), date_obj.getMonth(), date_obj.getDate(), 23,59,59,999);
                    periodPrime[1].endDate = new Date( date_obj.getFullYear(), date_obj.getMonth(), date_obj.getDate(), 23,59,59,999);
                    periodPrime[2].endDate = new Date( date_obj.getFullYear(), date_obj.getMonth(), date_obj.getDate(), 23,59,59,999);
                    periodPrime[3].endDate = new Date( date_obj.getFullYear(), date_obj.getMonth(), date_obj.getDate(), 23,59,59,999);
                    periodPrime[4].endDate = parsedData[ parsedData.length - 1 ].dateObj;

                    selectedStartDate = periodPrime[4].startDate;
                    selectedEndDate = periodPrime[4].endDate;

                    /* scale for timeline */
                    var minDate = parseDate("20160101000000000"), maxDate = parseDate("20160131000000000");
                    // xScale.domain([ minDate, maxDate ]).range([0, timeWidth - margin.left - margin.right]);
                    xScale.domain([ selectedStartDate, selectedEndDate ]).range([0, timeWidth - margin.left - margin.right]);

                    yScale.domain([ 000000000, 235959999]).range([0, timeHeight]);
                    var minTime = dateFullParser("00:00:00:001"), maxTime = dateFullParser("23:59:59:999");
                    yScaleForAxis.domain([minTime, maxTime]).range([0, timeHeight]);


                    console.log("--- data loaded ---");
                    console.log("timeWidth", timeWidth);
                    console.log("timeHeight", timeHeight);


                    /* call functions */
      	            self.e.publish('draw:axis');
      	            self.e.publish('draw:mapcircle');
      	            self.e.publish('draw:timelinecircle');
      	            // self.e.publish('draw:periodmenu');
                    self.e.publish('update:mainloop');
                    //resizeTimeline();

                    /* about map */
                    map.on("viewreset", update);
                    update();

                    function update() {
                      mapCircles.attr("transform",
                      function(d) {
                        var _x = map.latLngToLayerPoint(d.LatLng).x - $("#infoDetailArea").width()/2;
                        var _y = map.latLngToLayerPoint(d.LatLng).y - minimunTimeHeight/2;
                        return "translate("+
                          _x + "," + _y + ")";
                        }
                      )
                    }
      			}; // loadReady
  	    }; //getData



        this.drawMapCircle = function() {
            mapCircles = mapContainer.selectAll("circle")
                .data( ParsedDataSelected, function(d) { return d.time; });

            mapCircles
                .enter().append('svg:circle')
                .attr("id", function(d, i) {
                  return "circle" + i;
                })
                .style("stroke", "black")
                .style("opacity", .4)
                .style("fill", "black")
                .attr("r", 4);
        };



        this.drawTimelineCircle = function() {

              /* axis 調整 */
              // conAxis.yAxisTicksValue(5);
              // axisContainer.transition().duration(0).call( conAxis );

              /* 位置調整 */
              $("#timelineArea").animate({
                top: $("#wrap").height() - minimunTimeHeight
              }, 1000 );

              //console.log("ParsedDataSelected", ParsedDataSelected);
              timelineCircles = mainCircleContainer.selectAll(".timedots")
                  .data( ParsedDataSelected, function(d) { return d.input; });

              timelineCircles
                  .enter().append('svg:circle')
                  .attr("id", function(d,i){
                    return "timedots"+i;
                  })
                  .attr({
                    cx: function(d, i){
                      return xScale(d.dateObj);
                    },
                    cy: function(d, i){
                      return yScale( d.time.substr(8) );
                    },
                    "r": dotsSize,
                    "classed": "timedots"
                  })
                  .on("mouseover", function(){
                      d3.select(this).style("opacity", 1.0)
                  })
                  .on("mouseout", function(){
                      d3.select(this).style("opacity", 0.6)
                  })
                  .on("click", function(d,i){
                      dataId = i;

                      if (dataIdPrev != -1) {
                          d3.select("#timedots" + dataIdPrev).transition().duration(500).attr("r", dotsSize);
                      };

                      d3.select("#timedots" + dataId).transition().duration(500).attr("r", dotsSize*10);
                      dataIdPrev = dataId;

                      self.e.publish('update:detail');
                  });
        };



        this.drawPeriodMenu = function() {
              d3.select("#favnavi")
                  .selectAll("li").data(periodPrime).enter()
                  .append("li")
                  .attr('class', function(d, i) {
                      if (menuNum == i) {
                        return 'active';
                      } else {
                        return '';
                      }
                  })
                  .append("a")
                  .attr("href", "#")
                  .on("click", function(d,i){
                      d3.selectAll("#favnavi li").attr('class', '');
          						$('#favnavi li').eq(i).addClass('active');
                      menuNum = i; console.log("menuNum", menuNum);
                      self.e.publish('update:menu');
                  })
                  .text(
                      function(d,i) {
                          return periodPrime[i].name;
                      }
                  );
        };



        this.drawAxis = function() {
            conAxis = d3.axis();
      			axisContainer.call( conAxis );
            defaultViewDone = true;
        };



        /* btn: autoplay switcher */
        $('#menuPlay input[type=radio]').change(function(){
            if ( $(this).val() == "ON") {
                $("#customBtn").hide();
                animBool = true;
                self.e.publish('update:mainloop');
            } else {
                $("#customBtn").show();
                animBool = false;
                clearTimeout(loopAnimId);
            };
        });



        /* btn: map timeline switcher */
        $('#menuView input[type=radio]').change(function(){
            if ($(this).val()=="TIMELINE") {
               viewMode = "timeline";
               $("#autoBtn").hide();
               $("#customBtn").hide();
               self.e.publish('update:map2timeline');
            } else {
               viewMode = "map";
               $("#autoBtn").show();
               self.e.publish('update:timeline2map');
            };
        });



        /* btn: prev & next */
        $('#prevBtn').click(function(){
            dataIdPrev = dataId; dataId = dataId - 1;
            if (dataId < 0) { dataId = ParsedDataSelected.length -1; }
            self.e.publish('update:mainloop');
        });
        $('#nextBtn').click(function(){
            dataIdPrev = dataId; dataId = dataId + 1;
            if (dataId == ParsedDataSelected.length) { dataId = 0; }
            self.e.publish('update:mainloop');
        });



        this.updateMap2Timeline = function() {
          if (animBool) {
              animBool = false;
              clearTimeout(loopAnimId);
              // $('#menuPlay input[type=radio]').val(['OFF']);
              $('input[name=playstate]').val(['OFF']);
              $('input[name=playstate]').parent().removeClass('active');
              $('input[name=playstate]:checked').parent().addClass('active');
          };
          self.e.publish('resize:timeline');
          self.e.publish('update:timelineCircle');
          //self.e.publish('update:axis');
        };



        this.updateTimeline2Map = function() {
          self.e.publish('resize:timeline');
          self.e.publish('update:timelineCircle');
          //self.e.publish('update:axis');

          if (!animBool) {
              animBool = true;
              self.e.publish('update:mainloop');
              $('#menuPlay input[type=radio]').val(['ON']);
              $('input[name=playstate]').parent().removeClass('active');
              $('input:checked').parent().addClass('active');
          }
        };



        this.updateMainLoop = function() { /* map movement */

            if (ParsedDataSelected.length != 0) {

                  /* pan */
                  var options = { "animate": "true"};
                  map.panTo( new L.LatLng( ParsedDataSelected[dataId].LatLng.lat, ParsedDataSelected[dataId].LatLng.lng), options );

                  /* show detail */
                  self.e.publish('update:detail');

                  /* visual effect */
                  d3.select("#circle" + dataId)
                      .transition().duration(500)
                      .attr("r", dotsSize*10);

                  if (dataIdPrev != -1) {
                      d3.select("#circle" + dataIdPrev).transition().duration(500).attr("r", dotsSize);
                      var _p = "#circle" + dataIdPrev;
                      var _px = d3.transform(d3.select(_p).attr("transform")).translate[0];
                      var _py = d3.transform(d3.select(_p).attr("transform")).translate[1];
                  };

                  /* repeat or not */
                  if (animBool) {
                      dataIdPrev = dataId;
                      dataId = dataId + 1;
                      if (dataId == ParsedDataSelected.length) { dataId = 0; }
                      loopAnimId = setTimeout(mainLoop, interval);
                  };

            } else {
                  /* show dialog */
                  var options={title:"No data on this period.",content:"Please select the other period.",buttons:[{label:"CLOSE"}]};
                  new ZMODAL(options);
        			    d3.select('.z-modal-box').style("top", "50%");

                  /* repeat or not */
                  if (animBool) { loopAnimId = setTimeout(mainLoop, interval); };
            }
        };



        function mainLoop() {
          self.e.publish('update:mainloop');
        }



        this.updateDetail = function() {

            d3.select("#year").text( yearParser( parsedData[dataId].dateObj ) );
            d3.select("#month").text( monthParser( parsedData[dataId].dateObj ) );
            d3.select("#day").text( dayParser( parsedData[dataId].dateObj ) );
            d3.select("#timedata").text( timeParser( parsedData[dataId].dateObj ) );
            d3.select("#lat").text( parsedData[dataId].LatLng["lat"] );
            d3.select("#lon").text( parsedData[dataId].LatLng["lng"] );

            /* input */
            if ( parsedData[dataId].input != "" ) {
                  var _type = parsedData[dataId].input.split(".")[1];
                  d3.select("#inputFileFormat").text( _type );
                  var  _t = "<div class='link'><a href='http://fabcam.cc/uploads/" + parsedData[dataId].input + "'>" + parsedData[dataId].input + "</a></div>"
                  $("#inputFileName").html( _t );
                  $("#inputFileName").css("color","#F00");
                  $("#inputFileName").css("text-decoration","underline");
                  show_image('http://fabcam.cc/uploads/' + parsedData[dataId].input, "input");
            } else {
                  d3.select("#inputFileFormat").text( "not available." );
                  d3.select("#inputFileName").text( "not available." );
                  $("#inputFileName").css("color","#00334d");
                  $("#inputFileName").css("text-decoration","none");
                  // show_image('../images/placeholder.png', "input");
            };

            /* output */
            if ( parsedData[dataId].output != "" ) {
                  var _type = parsedData[dataId].output.split(".")[1];
                  d3.select("#outputFileFormat").text( _type );
                  var _t = "<div class='link'><a href='http://fabcam.cc/uploads/" + parsedData[dataId].output + "'>" + parsedData[dataId].output + "</a></div>"
                  $("#outputFileName").html( _t );
                  $("#outputFileName").css("color","#F00");
                  $("#outputFileName").css("text-decoration","underline");
                  if ((_type == "png") || (_type == "jpg") || (_type == "bpm")) {
                      show_image('http://fabcam.cc/uploads/' + parsedData[dataId].output, "output");
                  }
            } else {
                  d3.select("#outputFileFormat").text( "not available." );
                  d3.select("#outputFileName").text( "not available." );
                  $("#outputFileName").css("color","#00334d");
                  $("#outputFileName").css("text-decoration","none");
                  // show_image('../images/placeholder.png', "output");
            };


            /* settings */
            if ( parsedData[dataId].settings != "" ) {
                  // d3.json("http://fabcam.cc/uploads/" + parsedData[dataId].settings, function(_data){
                  d3.json("assets/data/1459694890357-setting.json", function(_data){
                      var  _t = "<div class='link'><a href='http://fabcam.cc/uploads/" + parsedData[dataId].settings + "'>" + parsedData[dataId].settings + "</a></div>"
                      $("#processFileName").html( _t );
                      $("#processFileName").css("color","#F00");
                      $("#processFileName").css("text-decoration","underline");

                      d3.select("#invert_image_btn").text("invert_image_btn: " + _data.input.invert_image_btn );
                      d3.select("#mod_dpi").text("mod_dpi: " +_data.input.mod_dpi );

                      d3.select("#mod_home").text("mod_home: " +_data.output.mod_home );
                      d3.select("#mod_jog").text("mod_jog: " +_data.output.mod_jog );
                      d3.select("#mod_move").text("mod_move: " +_data.output.mod_move );
                      d3.select("#mod_roland_machine").text("mod_roland_machine: " +_data.output.mod_roland_machine );
                      d3.select("#mod_speed").text("mod_speed: " +_data.output.mod_speed );
                      d3.select("#mod_xmin").text("mod_xmin: " +_data.output.mod_xmin );
                      d3.select("#mod_ymin").text("mod_ymin: " +_data.output.mod_ymin );
                      d3.select("#mod_zmin").text("mod_zmin: " +_data.output.mod_zmin );

                      d3.select("#mod_climb").text("mod_climb: " +_data.process.mod_climb );
                      d3.select("#mod_conventional").text("mod_conventional: " +_data.process.mod_conventional );
                      d3.select("#mod_depth").text("mod_depth: " +_data.process.mod_depth );
                      d3.select("#mod_diameter").text("mod_diameter: " +_data.process.mod_diameter );
                      d3.select("#mod_error").text("mod_error: " +_data.process.mod_error );
                      d3.select("#mod_merge").text("mod_merge: " +_data.process.mod_merge );
                      d3.select("#mod_offsets").text("mod_offsets: " +_data.process.mod_offsets );
                      d3.select("#mod_order").text("mod_order: " +_data.process.mod_order );
                      d3.select("#mod_overlap").text("mod_overlap: " +_data.process.mod_overlap );
                      d3.select("#mod_sequence").text("mod_sequence: " +_data.process.mod_sequence );
                      d3.select("#mod_sort").text("mod_sort: " +_data.process.mod_sort );
                      d3.select("#mod_threshold").text("mod_threshold: " + _data.process.mod_threshold );
                  });

            } else {
                  //d3.select("#setting").text( "" );
            };
        };

        function show_image(src, mode) {
            if (mode =="input") {
                $('#inputContentImage img').attr('src', src).load(function() {
                    $(this).css('width', '100%'); $(this).css('height', '100%');
                });
            } else {
                $('#outputContentImage img').attr('src', src).load(function() {
                    $(this).css('width', '100%'); $(this).css('height', '100%');
                });
            }
        }



        this.updateMapCircle = function() {

              mapCircles.selectAll("circle")
                  .data( ParsedDataSelected, function(d) { return d.time; })
                  .transition().duration(1000).ease('cubic')
                          .style("fill", function(d,i){
                            return "black";
                          });

              mapCircles
                  .exit().transition().remove();
        }



        this.updateTimelineCircle = function() {

          timelineCircles
              .transition().duration(1000).ease('cubic')
              .attr({
                cx: function(d, i){
                  return xScale(d.dateObj);
                },
                cy: function(d, i){
                  return yScale( d.time.substr(8) );
                },
                "r": dotsSize,
                "classed": "timedots"
              })
              .style("opacity", 0.6)
              .style("fill", "#000");

          timelineCircles.exit().transition().remove();

        }



        this.updateAxis = function() {
            axisContainer.transition().duration(1000).call( conAxis );
        };



        this.menuChange = function() {
            /* xDomain change */
            selectedStartDate = periodPrime[menuNum].startDate;
            selectedEndDate = periodPrime[menuNum].endDate;
            xScale.domain([ selectedStartDate, selectedEndDate ]);
            console.log("selectedStartDate", selectedStartDate);
            console.log("selectedEndDate", selectedEndDate);

            /* xAxis change */
            switch (menuNum){
              case 0:
                conAxis.xAxisTicksValue(2);
                //axisContainer.transition().duration(1000).call( conAxis );
                break;
              case 1:
                conAxis.xAxisTicksValue(6);
                //axisContainer.transition().duration(1000).call( conAxis );
                break;
              case 2:
                conAxis.xAxisTicksValue(8);
                //axisContainer.transition().duration(1000).call( conAxis );
                break;
              case 3:
                conAxis.xAxisTicksValue(8);
                //axisContainer.transition().duration(1000).call( conAxis );
                break;
              case 4:
                conAxis.xAxisTicksValue(8);
                //axisContainer.transition().duration(1000).call( conAxis );
                break;
            }

            /* filter data from selectedStartDate to selectedEndDate */
            ParsedDataSelected.length = 0;
            for (var i=0; i<parsedData.length; i++) {

              if ((parsedData[i].dateObj.getTime() >= selectedStartDate.getTime()) &&
                 ((parsedData[i].dateObj.getTime() <= selectedEndDate.getTime())))
                 {
                    ParsedDataSelected.push( parsedData[i] );
                 }
            };

            self.e.publish('update:mapCircle');
            self.e.publish('update:timelineCircle');
            self.e.publish('update:axis');
            self.e.publish('resize:timeline');
        };



        this.resizeTimeline = function() {

            if (defaultViewDone) {

                  if (viewMode == "map") {

                        timeWidth = $("#wrap").width() - $("#infoDetailArea").outerWidth();
                        timeHeight = minimunTimeHeight;

                        /* 位置調整 */
                        $("#timelineArea").animate({
                          top: $("#wrap").height() - minimunTimeHeight
                        }, 1000 );

                        /* axis 調整 */
                        conAxis.yAxisTicksValue(5);
                        //axisContainer.transition().duration(0).call( conAxis );
                        //self.e.publish('update:axis');

                  } else if  (viewMode == "timeline") {

                        timeWidth = $("#wrap").width() - $("#infoDetailArea").outerWidth();
                        timeHeight = $("#wrap").height() - $("#headerArea").height();

                        console.log("--- resized timeview ---");
                        console.log("timeWidth", timeWidth);
                        console.log("timeHeight", timeHeight);

                        /* 位置調整 */
                        $("#timelineArea").animate({
                            top: $("#headerArea").height()
                        }, 1000 );

                        /* axis 調整 */
                        conAxis.yAxisTicksValue(8);
                        //axisContainer.transition().duration(0).call( conAxis );
                        //self.e.publish('update:axis');

                  } else {
                      console.log("oh no!");
                  };

                  /* scale 調整 */
                  xScale.range([0, timeWidth - margin.left - margin.right]);
                  yScale.range([0, timeHeight]);
                  yScaleForAxis.range([0, timeHeight]);
                  //self.e.publish('update:axis');

                  console.log("--- resized timeview common ---");
                  console.log("timeWidth", timeWidth);
                  console.log("timeHeight", timeHeight);

                  /* svgサイズ調整 */
                  $("#chartTimeline").attr("width", timeWidth);
                  $("#chartTimeline").attr("height", timeHeight);
                  // $("#mainCircleContainer").attr("width", timeWidth);
                  // $("#mainCircleContainer").attr("height", timeHeight);
                  // $("#axisContainer").attr("width", timeWidth);
                  // $("#axisContainer").attr("height", timeHeight);

                  /* viewBoxサイズ調整 */
                  var _shape = document.getElementById("chartTimeline");
                  var _ua = "0 0 "+ timeWidth + " " + timeHeight;
                  _shape.setAttribute("viewBox", _ua);

                  /* DIV大きさ調整 */
                  $("#chartTimeline").animate({
                    height: timeHeight
                  }, 1000 );

                  /* axis */
                  // xA.transition().duration(1000).call(xAxis);
                  // yA.transition().duration(1000).call(yAxis);
                  self.e.publish('update:axis');
            }

        };

        this.init.apply( this, arguments );
};



console.log("before gg");
gg = new Chart;
console.log("after gg");



/* -----------------------------------
  responsive with window size
----------------------------------- */

    $(window).on("resize", function() {

            console.log("exist");

              $("#infoDetailArea").height($("#wrap").height() - $("#headerArea").height());

              /* map */
              mapWidth = $("#wrap").width(); console.log("mapWidth", mapWidth);
              mapHeight = $("#wrap").height() - $("#headerArea").height();

              /* map svg */
              $("#chartMap").width(mapWidth);
              $("#chartMap").height(mapHeight);
              $("#mapDiv").width(mapWidth);
              $("#mapDiv").height(mapHeight);

              /* map viewbox */
              var _shape = document.getElementById("chartMap");
              var _ua = "0 0 "+ mapWidth + " " + mapHeight;
              _shape.setAttribute("viewBox", _ua);

              map.invalidateSize();

              console.log("resize");

              console.log("herehere");
              gg.resizeTimeline();

    }).trigger("resize");

});



var xScale, yScale;
var yScaleForAxis;
var mapWidth, mapHeight;
var minimunTimeHeight;
var margin;
var timeWidth;
var timeHeight;
var defaultViewDone = false;
