d3.axis = {};

d3.axis = function module() {

    var _firstTime = true;
    var xAxisTicksValue = 8;
    var yAxisTicksValue = 5;


    /* -----------------------------------
      axis
    ----------------------------------- */
    var xAxis, yAxis;
    var xA, yA;


    function _my(_selection) {

        _selection.each(function() {

            if (_firstTime) {

                _firstTime = false;

                xAxis = d3.svg.axis()
                    .scale(xScale).orient("top").ticks(xAxisTicksValue)
                    .tickFormat( d3.time.format('%d/%m') )
                    .innerTickSize(-timeHeight).outerTickSize(0).tickPadding(1);

                yAxis = d3.svg.axis()
                    .scale(yScaleForAxis).orient("left").ticks(yAxisTicksValue)
                    .innerTickSize(-timeWidth).outerTickSize(0).tickPadding(1);

                xA = d3.select(this).append("g")
                    .attr("class", "x axis")
                    // .attr("transform", "translate(" + margin.left + "," + (cHeight + margin.top) + ")")
                    .call(xAxis)
                    .selectAll("text")
                    .attr("dy", "-1.0em");

                yA = d3.select(this).append("g")
                    .attr("class", "y axis")
                    //.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                    .call(yAxis)
                    .selectAll("text")
                    .attr("dx", "-1.0em");
            };

            console.log("---axis---");

            // d3.select("g.x.axis").transition().duration(1000).attr("opacity", 1.0);
            // d3.select("g.y.axis").transition().duration(1000).attr("opacity", 1.0);

            xAxis.scale(xScale);
            yAxis.scale(yScale);

            xAxis.ticks(xAxisTicksValue);
            yAxis.ticks(yAxisTicksValue);
            console.log("xAxisTicksValue", xAxisTicksValue);
            console.log("yAxisTicksValue", yAxisTicksValue);

            // d3.select(".x.axis").transition().duration(2000).call(xAxis);
            // d3.select(".y.axis").transition().duration(2000).call(xAxis);

            xA.transition().duration(1000).call(xAxis);
            yA.transition().duration(1000).call(yAxis);


        });
    }

    _my.xAxisTicksValue = function(_value) {
        if (!arguments.length) return xAxisTicksValue;
        xAxisTicksValue = _value;
        return this;
    };

    _my.yAxisTicksValue = function(_value) {
        if (!arguments.length) return yAxisTicksValue;
        yAxisTicksValue = _value;
        return this;
    };

    return _my;

};
