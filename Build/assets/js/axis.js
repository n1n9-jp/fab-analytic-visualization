d3.axis = {};

d3.axis = function module() {

    var _firstTime = true;


    /* -----------------------------------
      axis
    ----------------------------------- */
    var xA, yA;


    function _my(_selection) {

        _selection.each(function() {

              xA = d3.select(this).selectAll(".x")
                  .data(["dummy"]);

              xA.enter().append("g").attr("class", "x axis")

              xA.call(xAxis)
                  .selectAll("text")
                  .attr("dy", "-1.0em");

               yA = d3.select(this).selectAll(".y")
                  .data(["dummy"]);

              yA.enter().append("g").attr("class", "y axis")

              yA.call(yAxis)
                  .selectAll("text")
                  .attr("dx", "-1.0em");

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
