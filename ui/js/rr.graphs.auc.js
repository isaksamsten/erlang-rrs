(function() {
    var calculate_auc = function(p) {
	function find_prob(p, c) {
	    for(n in p) {
		if(p[n].class == c) {
		    return p[n].probability;
		}
	    }
	    return 0;
	}
	
	var result = { tp: [], fp: [] };
	var total = p.predictions.length;
	for(c in p.classes) {
	    var ctotal = p.classes[c].count;
	    var x = p.predictions.sort(function(a, b) {
		var fa = find_prob(a.predictions, p.classes[c].class);
		var fb = find_prob(b.predictions, p.classes[c].class);
		return fa - fb;
	    });
	    console.log(p.classes[c], p.predictions);
	    var tp = [], fp = [];
	    var t = 0.0, f = 0.0;
	    for(n in p.predictions) {
		(function (real, predicted, current) {
		    if(real == predicted && real == current) {
			t += 1;
		    } else if (real != current) {
			f += 1;
		    }
		    tp.push(t/ctotal);
		    fp.push(f/(total-ctotal));
		}(p.predictions[n].real, p.predictions[n].predictions[0].class, p.classes[c].class));
	    }
	    result.tp.push(tp);
	    result.fp.push(fp);
	}

	return result;	
    }
    /**
     * Draw an AUC-chart on paper
     *
     */
    function AUC(paper, x, y, width, height, predictions, opts) {
	opts.baseline = opts.baseline || false;
	opts.baseline_legend = opts.baseline_legend || "Baseline";
	opts.baseline_color = opts.baseline_color || "#000";
	opts.baseline_dasharray = opts.baseline_dasharray || "-";
	opts["stroke-width"] = opts["stroke-widht"] || 3;
	opts.legends = opts.legends || predictions.classes.map(function(x) { return x.class});

	var inst = this;
	var chart = paper.set(),
	auc = calculate_auc(predictions);
	if(opts.baseline) {
	    auc.tp.push([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]);
	    auc.fp.push([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]);
	}
	var line = paper.linechart(x - width/2, y, width, height, auc.fp, auc.tp, {
	    axis: "1 1 1 1",
	    axisxstep: 0,
	    axisystep: 0,
	});

	chart.push(line);
	chart.auc = line;
	chart.lines = line.lines;

	
	var labels = [];
	if($.isArray(opts.legends)) {
	    labels = opts.legends;
	} else {
	    for(key in opts.legends) {
		if(key != "average") {
		    labels.push(key + " (" + opts.legends[key].toFixed(5) + ")");
		}
	    }
	}
	
	if(opts.baseline) {
	    labels.push(opts.baseline_legend);
	}
	chart.labels = paper.set();
 	var nx = x - width/2+10; var h = y+height+25;
 	for( var i = 0; i < labels.length; ++i ) {
 	    var clr = chart.lines[i].attr("stroke");
 	    chart.labels.push(paper.set());
 	    chart.labels[i].push(paper["circle"](nx + 5, h, 5).attr({fill: clr, stroke: "none"}));
 	    chart.labels[i].push(txt = paper.text(nx + 20, h, labels[i]).attr({fill: "#000", "text-anchor": "start"}));
 	    nx += chart.labels[i].getBBox().width * 1.3;
 	};
	
	for(var n=0; n < labels.length; n++) {
	    chart.lines[n].label = chart.labels[n]
	}
	
	chart.labels.attr({font: "12px Helvetica"});
	line.axis.attr({font: "14px Helvetica"});
	line.lines.attr({"stroke-width": opts["stroke-width"]});
	
	if(opts.baseline) {
	    line.lines[line.lines.length-1].label[0].attr({fill: "none", stroke:"#000", "stroke-dasharray": "-"});
	    line.lines[line.lines.length-1].attr({"stroke": opts.baseline_color, 
						  "stroke-dasharray": opts.baseline_dasharray, 
						  "stroke-width": opts["stroke-width"] - 1}).toBack();
	}

	chart.each = function(fun) {
	    for(l in this.lines) {
		fun.apply(this.lines[l]);
	    }	    
	};

	return chart;
    }

    var F = function(){};
    F.prototype = Raphael.g;
    AUC.prototype = new F;

    Raphael.fn.auc = function(x, y, width, height, predictions, opts) {
	return new AUC(this, x, y, width, height, predictions, opts);	
    };

}());
