(function () {
  var callWithJQuery,
    indexOf = [].indexOf || function (item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice,
    bind = function (fn, me) { return function () { return fn.apply(me, arguments); }; };

  callWithJQuery = function (pivotModule) {
    if (typeof exports === 'object' && typeof module === 'object') {
      return pivotModule(require('jquery'), require('d3'));
    } else if (typeof define === 'function' && define.amd) {
      return define(['jquery'], pivotModule);
    } else {
      return pivotModule(jQuery);
    }
  };

  callWithJQuery(function ($, d3) {
    var PivotData, addSeparators, addSeparatorsCharacterFormat, aggregatorTemplates, aggregators, dayNamesEn, derivers, getSort, locales, mthNamesEn, multiMetricsTableRenderer, naturalSort, numberFormat, pivotTableRenderer, renderers, sortAs, usFmt, usFmtInt, usFmtPct, usNegFmt, accountingFmt, zeroPad, m;
    addSeparators = function (nStr, thousandsSep, decimalSep) {
      var rgx, x, x1, x2;
      nStr += '';
      x = nStr.split('.');
      x1 = x[0];
      x2 = x.length > 1 ? decimalSep + x[1] : '';
      rgx = /(\d+)(\d{3})/;
      while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + thousandsSep + '$2');
      }
      return x1 + x2;
    };
    addSeparatorsCharacterFormat = function (nStr, thousandsSep, decimalSep) {
      var rgx, x, x1, x2, x3;
      x1 = nStr;
      if (x1 < 0) {
        nStr += '';
        x = nStr.split('.');
        x1 = x[0];
        x2 = x.length > 1 ? decimalSep + x[1] : '';
        rgx = /(\d+)(\d{3})/;
        while (rgx.test(x1)) {
          x1 = x1.replace(rgx, '$1' + thousandsSep + '$2');
        }
        x1 = x1.replace('-', '');
        x3 = x1 + x2;
        x3 = '(' + x3 + ')';
        return x3;
      } else {
        nStr += '';
        x = nStr.split('.');
        x1 = x[0];
        x2 = x.length > 1 ? decimalSep + x[1] : '';
        rgx = /(\d+)(\d{3})/;
        while (rgx.test(x1)) {
          x1 = x1.replace(rgx, '$1' + thousandsSep + '$2');
        }
        return x1 + x2;
      }
    };
    numberFormat = function (opts) {
      var defaults;
      defaults = {
        digitsAfterDecimal: 2,
        scaler: 1,
        thousandsSep: ',',
        decimalSep: '.',
        prefix: '',
        suffix: '',
      };
      opts = $.extend(defaults, opts);
      return function (x) {
        var result;
        if (isNaN(x) || !isFinite(x)) {
          return '';
        }
        if (x === 0 && !opts.showZero) {
          return '';
        }
        result = addSeparators(x.toFixed(opts.digitsAfterDecimal), opts.thousandsSep, opts.decimalSep);
        return result;

      };
    };
    usFmt = numberFormat();
    accountingFmt = function (opts) {
      var defaults;
      defaults = {
        digitsAfterDecimal: 2,
        scaler: 1,
        thousandsSep: ',',
        decimalSep: '.',
        showZero: false
      };
      opts = $.extend(defaults, opts);
      return function (x) {
        var result;
        if (isNaN(x) || !isFinite(x)) {
          return '';
        }
        if (x === 0 && !opts.showZero) {
          return '';
        }
        result = addSeparatorsCharacterFormat(x.toFixed(opts.digitsAfterDecimal), opts.thousandsSep, opts.decimalSep);
        return result;
      };
    };
    usNegFmt = accountingFmt();
    usFmtInt = numberFormat({
      digitsAfterDecimal: 0
    });
    usFmtPct = numberFormat({
      digitsAfterDecimal: 1,
      scaler: 100,
      suffix: '%'
    });
    aggregatorTemplates = {
      count: function (formatter) {
        if (formatter == null) {
          formatter = usFmt;
        }
        return function (arg) {
          return function (data, rowKey, colKey) {
            var summedFacts = {};
            console.log(arg);
            return {
              count: 0,
              push: function () {
                summedFacts.Count = this.count++;
                return summedFacts.Count;
              },
              value: function () {
                return summedFacts;
              },
              multivalue: function () {
                return summedFacts;
              },
              multivalue2: function () {
                return parseFloat(summedFacts);
              },
              format: formatter
            };
          };
        };
      },
      sum: function (formatter, n) {
        if (formatter == null) {
          formatter = usFmt;
        }
       
        return function (arg) {
          return function (data, rowKey, colKey) {
            var attr, i, len, summedFacts;
            attr = arg[0];
            summedFacts = {};
            i = 0;
            len = arg.length;
            while (i < len) {
              summedFacts[arg[i]] = 0;
              i++;
            }
            return {
              push: function (record) {
                i = 0;
                while (i < len) {
                  if (!isNaN(parseFloat(record[arg[i]]))) {
                    summedFacts[arg[i]] += parseFloat(record[arg[i]]);
                  }
                  i++;
                }
                return summedFacts;
              },
              value: function () {
                return parseFloat(summedFacts[arg[0]]);
              },
              multivalue: function () {
                return summedFacts;
              },
              multivalue2: function () {
                return parseFloat(summedFacts);
              },
              format: formatter,
              numInputs: attr != null ? 0 : 2
            };
          };
        };
      },
      runningStat: function (mode, ddof, formatter, n) {
        if (mode == null) {
          mode = 'mean';
        }
        if (ddof == null) {
          ddof = 1;
        }
        if (formatter == null) {
          formatter = usFmt;
        }
        return function (arg) {
          var attr;
          attr = arg[0];
          var n, m, s;
          return function (data, rowKey, colKey) {
            var summedFacts = {};
            n = 0;
            m = 0;
            s = 0;
            return {
              push: function (record) {
                var mNew, x;
                x = parseFloat(record[attr]);
                if (isNaN(x)) {
                  summedFacts[arg[0]] = 0;
                } else {
                  n += 1.0;
                  if (n === 1.0) {
                    m = x;
                  } else {
                    mNew = m + (x - m) / n;
                    s = s + (x - m) * (x - mNew);
                    m = mNew;
                  }
                  summedFacts[arg[0]] = m;
                }
                return summedFacts;
              },
              value: function () {
                if (mode === 'mean') {
                  if (n === 0) {
                    return 0 / 0;
                  } else {
                    return summedFacts[arg[0]];
                  }
                }
                if (n <= ddof) {
                  return 0;
                }
                switch (mode) {
                  case 'var':
                    return s / (n - ddof);
                  case 'stdev':
                    return Math.sqrt(s / (n - ddof));
                }
              },
              multivalue: function () {
                return summedFacts;
              },
              multivalue2: function () {
                return parseFloat(summedFacts);
              },
              format: formatter,
              numInputs: attr != null ? 0 : 2
            };
          };
        };
      },
      extremes: function (mode, formatter, n) {
        if (formatter == null) {
          formatter = usFmt;
        }
        return function (arg) {
          var attr;
          attr = arg[0];
          var val = null;
          var sorter;
          return function (data, rowKey, colKey) {
            var summedFacts = {};
            return {
              sorter: getSort(data != null ? data.sorters : void 0, attr),
              push: function (record) {
                var ref, ref1, ref2, x;
                x = record[attr];
                if (mode === 'min' || mode === 'max') {
                  x = parseFloat(x);
                  if (!isNaN(x)) {
                    val = Math[mode](x, (ref = val) != null ? ref : x);
                  }
                }
                if (mode === 'first') {
                  if (this.sorter(x, (ref1 = val) != null ? ref1 : x) <= 0) {
                    val = x;
                  }
                }
                if (mode === 'last') {
                  if (this.sorter(x, (ref2 = val) != null ? ref2 : x) >= 0) {
                    val = x;
                  }
                }
                summedFacts[arg[0]] = val;
                return summedFacts;
              },
              value: function () {
                return summedFacts[arg[0]];
              },
              multivalue: function () {
                return summedFacts;
              },
              multivalue2: function () {
                return parseFloat(summedFacts);
              },
              format: function (x) {
                if (isNaN(x)) {
                  return x;
                } else {
                  return formatter(x);
                }
              },
              numInputs: attr != null ? 0 : 2
            };
          };
        };
      },
      quantile: function (q, formatter, n) {
        if (formatter == null) {
          formatter = usFmt;
        }
        return function (arg) {
          var attr;
          attr = arg[0];
          return function (data, rowKey, colKey) {
            var summedFacts = {};
            return {
              vals: [],
              push: function (record) {
                var x;
                x = parseFloat(record[attr]);
                if (!isNaN(x)) {
                  this.vals.push(x);
                  summedFacts[arg[0]] = x;
                }
                return summedFacts;
              },
              value: function () {
                var i;
                if (this.vals.length === 0) {
                  return null;
                }
                this.vals.sort(function (a, b) {
                  return a - b;
                });
                i = (this.vals.length - 1) * q;
                return (this.vals[Math.floor(i)] + this.vals[Math.ceil(i)]) / 2.0;
              },
              multivalue: function () {
                return summedFacts;
              },
              multivalue2: function () {
                return parseFloat(summedFacts);
              },
              format: formatter,
              numInputs: attr != null ? 0 : 2
            };
          };
        };
      },
    };
    aggregatorTemplates.average = function (f, n) {
      return aggregatorTemplates.runningStat('mean', 1, f, n);
    };
    aggregatorTemplates.stdev = function (ddof, f, n) {
      return aggregatorTemplates.runningStat('stdev', ddof, f, n);
    };
    aggregatorTemplates.median = function (f, n) {
      return aggregatorTemplates.quantile(0.5, f, n);
    };
    aggregatorTemplates.max = function (f, n) {
      return aggregatorTemplates.extremes('max', f, n);
    };
    aggregatorTemplates.min = function (f, n) {
      return aggregatorTemplates.extremes('min', f, n);
    };
    aggregators = (function (tpl) {
      return {
        'Multi Average': tpl.average(usFmt, m),
        'Multi Sum': tpl.sum(usFmt, m),
        'Negative Format Multi Sum': tpl.sum(usNegFmt, m),
        'Multi Median': tpl.median(usFmt, m),
        'Multi Min': tpl.min(usFmt, m),
        'Multi Max': tpl.max(usFmt, m),
        'Multi Standard Deviation': tpl.stdev(1, usFmt, m),
      };
    })(aggregatorTemplates);
    renderers = {
      'Multiple Metrics Table': function (data, opts) {
        return multiMetricsTableRenderer(data, opts);
      },
    };
    locales = {
      en: {
        aggregators: aggregators,
        renderers: renderers,
        localeStrings: {
          renderError: 'An error occurred rendering the PivotTable results.',
          computeError: 'An error occurred computing the PivotTable results.',
          uiRenderError: 'An error occurred rendering the PivotTable UI.',
          selectAll: 'Select All',
          selectNone: 'Select None',
          tooMany: '(too many to list)',
          filterResults: 'Filter results',
          totals: 'Totals',
          vs: 'vs',
          by: 'by'
        }
      }
    };
    mthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    zeroPad = function (number) {
      return ('0' + number).substr(-2, 2);
    };
    derivers = {
      bin: function (col, binWidth) {
        return function (record) {
          return record[col] - record[col] % binWidth;
        };
      },
      dateFormat: function (col, formatString, utcOutput, mthNames, dayNames) {
        var utc;
        if (utcOutput == null) {
          utcOutput = false;
        }
        if (mthNames == null) {
          mthNames = mthNamesEn;
        }
        if (dayNames == null) {
          dayNames = dayNamesEn;
        }
        utc = utcOutput ? 'UTC' : '';
        return function (record) {
          var date;
          date = new Date(Date.parse(record[col]));
          if (isNaN(date)) {
            return '';
          }
          return formatString.replace(/%(.)/g, function (m, p) {
            switch (p) {
              case 'y':
                return date['get' + utc + 'FullYear']();
              case 'm':
                return zeroPad(date['get' + utc + 'Month']() + 1);
              case 'n':
                return mthNames[date['get' + utc + 'Month']()];
              case 'd':
                return zeroPad(date['get' + utc + 'Date']());
              case 'w':
                return dayNames[date['get' + utc + 'Day']()];
              case 'x':
                return date['get' + utc + 'Day']();
              case 'H':
                return zeroPad(date['get' + utc + 'Hours']());
              case 'M':
                return zeroPad(date['get' + utc + 'Minutes']());
              case 'S':
                return zeroPad(date['get' + utc + 'Seconds']());
              default:
                return '%' + p;
            }
          });
        };
      }
    };
    naturalSort = (function (_this) {
      return function (as, bs) {
        var a, a1, b, b1, nas, nbs;
        if ((bs != null) && (as == null)) {
          return -1;
        }
        if ((as != null) && (bs == null)) {
          return 1;
        }
        if (typeof as === 'number' && isNaN(as)) {
          return -1;
        }
        if (typeof bs === 'number' && isNaN(bs)) {
          return 1;
        }
        nas = +as;
        nbs = +bs;
        if (nas < nbs) {
          return -1;
        }
        if (nas > nbs) {
          return 1;
        }
        if (typeof as === 'number' && typeof bs !== 'number') {
          return -1;
        }
        if (typeof bs === 'number' && typeof as !== 'number') {
          return 1;
        }
        if (typeof as === 'number' && typeof bs === 'number') {
          return 0;
        }
        if (isNaN(nbs) && !isNaN(nas)) {
          return -1;
        }
        if (isNaN(nas) && !isNaN(nbs)) {
          return 1;
        }
        a = String(as);
        b = String(bs);
        if (a === b) {
          return 0;
        }
        if (!(rd.test(a) && rd.test(b))) {
          return (a > b ? 1 : -1);
        }
        a = a.match(rx);
        b = b.match(rx);
        while (a.length && b.length) {
          a1 = a.shift();
          b1 = b.shift();
          if (a1 !== b1) {
            if (rd.test(a1) && rd.test(b1)) {
              return a1.replace(rz, '.0') - b1.replace(rz, '.0');
            } else {
              return (a1 > b1 ? 1 : -1);
            }
          }
        }
        return a.length - b.length;
      };
    })(this);
    sortAs = function (order) {
      var i, lMapping, mapping, x;
      mapping = {};
      lMapping = {};
      for (i in order) {
        x = order[i];
        mapping[x] = i;
        if (typeof x === 'string') {
          lMapping[x.toLowerCase()] = i;
        }
      }
      return function (a, b) {
        if ((mapping[a] != null) && (mapping[b] != null)) {
          return mapping[a] - mapping[b];
        } else if (mapping[a] != null) {
          return -1;
        } else if (mapping[b] != null) {
          return 1;
        } else if ((lMapping[a] != null) && (lMapping[b] != null)) {
          return lMapping[a] - lMapping[b];
        } else if (lMapping[a] != null) {
          return -1;
        } else if (lMapping[b] != null) {
          return 1;
        } else {
          return naturalSort(a, b);
        }
      };
    };
    getSort = function (sorters, attr) {
      var sort;
      if (sorters != null) {
        if ($.isFunction(sorters)) {
          sort = sorters(attr);
          if ($.isFunction(sort)) {
            return sort;
          }
        } else if (sorters[attr] != null) {
          return sorters[attr];
        }
      }
      return naturalSort;
    };

    /*
    Data Model class
     */
    PivotData = (function () {
      function PivotData(input, opts) {
        this.getAggregator = bind(this.getAggregator, this);
        this.getRowKeys = bind(this.getRowKeys, this);
        this.getColKeys = bind(this.getColKeys, this);
        this.arrSort = bind(this.arrSort, this);
        this.aggregator = opts.aggregator;
        this.aggregatorName = opts.aggregatorName;
        this.colAttrs = opts.cols;
        this.rowAttrs = opts.rows;
        this.valAttrs = opts.vals;
        this.sorters = opts.sorters;
        this.tree = {};
        this.rowKeys = [];
        this.colKeys = [];
        this.sortKeys = bind(this.sortKeys, this);
        this.rowTotals = {};
        this.colTotals = {};
        this.allTotal = this.aggregator(this, [], []);
        this.sorted = false;
        PivotData.forEachRecord(input, opts.derivedAttributes, (function (_this) {
          return function (record) {
            if (opts.filter(record)) {
              return _this.processRecord(record);
            }
          };
        })(this));
      }

      PivotData.forEachRecord = function (input, derivedAttributes, f) {
        var addRecord, compactRecord, i, j, k, l, len1, record, ref1, results, results1, tblCols;
        if ($.isEmptyObject(derivedAttributes)) {
          addRecord = f;
        } else {
          addRecord = function (record) {
            var k, ref1, v;
            for (k in derivedAttributes) {
              v = derivedAttributes[k];
              record[k] = (ref1 = v(record)) != null ? ref1 : record[k];
            }
            return f(record);
          };
        }
        if ($.isFunction(input)) {
          return input(addRecord);
        } else if ($.isArray(input)) {
          if ($.isArray(input[0])) {
            results = [];
            for (i in input) {
              if (!hasProp.call(input, i)) continue;
              compactRecord = input[i];
              if (!(i > 0)) {
                continue;
              }
              record = {};
              ref1 = input[0];
              for (j in ref1) {
                if (!hasProp.call(ref1, j)) continue;
                k = ref1[j];
                record[k] = compactRecord[j];
              }
              results.push(addRecord(record));
            }
            return results;
          } else {
            results1 = [];
            for (l = 0, len1 = input.length; l < len1; l++) {
              record = input[l];
              results1.push(addRecord(record));
            }
            return results1;
          }
        } else if (input instanceof jQuery) {
          tblCols = [];
          $('thead > tr > th', input).each(function (i) {
            return tblCols.push($(this).text());
          });
          return $('tbody > tr', input).each(function (i) {
            record = {};
            $('td', this).each(function (j) {
              return record[tblCols[j]] = $(this).text();
            });
            return addRecord(record);
          });
        } else {
          throw new Error('unknown input format');
        }
      };

      PivotData.convertToArray = function (input) {
        var result;
        result = [];
        PivotData.forEachRecord(input, {}, function (record) {
          return result.push(record);
        });
        return result;
      };

      PivotData.prototype.arrSort = function (attrs) {
        var a, sortersArr;
        sortersArr = (function () {
          var l, len1, results;
          results = [];
          for (l = 0, len1 = attrs.length; l < len1; l++) {
            a = attrs[l];
            results.push(getSort(this.sorters, a));
          }
          return results;
        }).call(this);
        return function (a, b) {
          var comparison, i, sorter;
          for (i in sortersArr) {
            if (!hasProp.call(sortersArr, i)) continue;
            sorter = sortersArr[i];
            comparison = sorter(a[i], b[i]);
            if (comparison !== 0) {
              return comparison;
            }
          }
          return 0;
        };
      };

      PivotData.prototype.sortKeys = function () {
        var v;
        if (!this.sorted) {
          this.sorted = true;
          v = (function (_this) {
            return function (r, c) {
              return _this.getAggregator(r, c).value();
            };
          })(this);
          switch (this.rowOrder) {
            case 'value_a_to_z':
              this.rowKeys.sort((function (_this) {
                return function (a, b) {
                  return naturalSort(v(a, []), v(b, []));
                };
              })(this));
              break;
            case 'value_z_to_a':
              this.rowKeys.sort((function (_this) {
                return function (a, b) {
                  return -naturalSort(v(a, []), v(b, []));
                };
              })(this));
              break;
            default:
              this.rowKeys.sort(this.arrSort(this.rowAttrs));
          }
          switch (this.colOrder) {
            case 'value_a_to_z':
              return this.colKeys.sort((function (_this) {
                return function (a, b) {
                  return naturalSort(v([], a), v([], b));
                };
              })(this));
            case 'value_z_to_a':
              return this.colKeys.sort((function (_this) {
                return function (a, b) {
                  return -naturalSort(v([], a), v([], b));
                };
              })(this));
            default:
              return this.colKeys.sort(this.arrSort(this.colAttrs));
          }
        }
      };

      PivotData.prototype.getColKeys = function () {
        this.sortKeys();
        return this.colKeys;
      };

      PivotData.prototype.getRowKeys = function () {
        this.sortKeys();
        return this.rowKeys;
      };
      PivotData.prototype.getColKeys = function () {
        return this.colKeys;
      };

      PivotData.prototype.getRowKeys = function () {
        return this.rowKeys;
      };

      PivotData.prototype.processRecord = function (record) {
        var colKey, flatColKey, flatRowKey, l, len1, len2, o, ref1, ref2, ref3, ref4, rowKey, x;
        colKey = [];
        rowKey = [];
        ref1 = this.colAttrs;
        for (l = 0, len1 = ref1.length; l < len1; l++) {
          x = ref1[l];
          colKey.push((ref2 = record[x]) != null ? ref2 : 'null');
        }
        ref3 = this.rowAttrs;
        for (o = 0, len2 = ref3.length; o < len2; o++) {
          x = ref3[o];
          rowKey.push((ref4 = record[x]) != null ? ref4 : 'null');
        }
        flatRowKey = rowKey.join(String.fromCharCode(0));
        flatColKey = colKey.join(String.fromCharCode(0));
        this.allTotal.push(record);
        if (rowKey.length !== 0) {
          if (!this.rowTotals[flatRowKey]) {
            this.rowKeys.push(rowKey);
            this.rowTotals[flatRowKey] = this.aggregator(this, rowKey, []);
          }
          this.rowTotals[flatRowKey].push(record);
        }
        if (colKey.length !== 0) {
          if (!this.colTotals[flatColKey]) {
            this.colKeys.push(colKey);
            this.colTotals[flatColKey] = this.aggregator(this, [], colKey);
          }
          this.colTotals[flatColKey].push(record);
        }
        if (colKey.length !== 0 && rowKey.length !== 0) {
          if (!this.tree[flatRowKey]) {
            this.tree[flatRowKey] = {};
          }
          if (!this.tree[flatRowKey][flatColKey]) {
            this.tree[flatRowKey][flatColKey] = this.aggregator(this, rowKey, colKey);
          }
          return this.tree[flatRowKey][flatColKey].push(record);
        }
      };

      PivotData.prototype.getAggregator = function (rowKey, colKey) {
        var agg, flatColKey, flatRowKey;
        flatRowKey = rowKey.join(String.fromCharCode(0));
        flatColKey = colKey.join(String.fromCharCode(0));
        if (rowKey.length === 0 && colKey.length === 0) {
          agg = this.allTotal;
        } else if (rowKey.length === 0) {
          agg = this.colTotals[flatColKey];
        } else if (colKey.length === 0) {
          agg = this.rowTotals[flatRowKey];
        } else {
          agg = this.tree[flatRowKey][flatColKey];
        }
        return agg != null ? agg : {
          value: (function () {
            return null;
          }),
          format: function () {
            return '';
          }
        };
      };

      PivotData.prototype.getAggregatorRule = function (aggKey) {
        return aggKey;
      };

      return PivotData;

    })();
    $.pivotUtilities = {
      aggregatorTemplates: aggregatorTemplates,
      aggregators: aggregators,
      renderers: renderers,
      derivers: derivers,
      locales: locales,
      naturalSort: naturalSort,
      numberFormat: numberFormat,
      sortAs: sortAs,
      PivotData: PivotData
    };

    /*
     Default Renderer for hierarchical table layout
      */

    multiMetricsTableRenderer = function (pivotData, opts) {
      var aggregator, c, colAttrs, colKey, colKeys, defaults, i, j, l, len1, len2, len3, len4, len5, len6, len7, len8, m, mc, n, numMetrics, o, q, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8, result, rowAttrs, rowKey, rowKeys, s, spanSize, t, tbody, td, th, thead, tAggregator, totalsAgg, tr, txt, u, val, w, x, y;
      defaults = {
        localeStrings: {
          totals: 'Totals'
        }
      };
      opts = $.extend(defaults, opts);
      colAttrs = pivotData.colAttrs;
      rowAttrs = pivotData.rowAttrs;
      rowKeys = pivotData.getRowKeys();
      colKeys = pivotData.getColKeys();
      result = document.createElement('table');
      result.className = 'pvtTable';
      spanSize = function (arr, i, j) {
        var l, len, noDraw, o, ref1, ref2, stop, x;
        if (i !== 0) {
          noDraw = true;
          for (x = l = 0, ref1 = j; 0 <= ref1 ? l <= ref1 : l >= ref1; x = 0 <= ref1 ? ++l : --l) {
            if (arr[i - 1][x] !== arr[i][x]) {
              noDraw = false;
            }
          }
          if (noDraw) {
            return -1;
          }
        }
        len = 0;
        while (i + len < arr.length) {
          stop = false;
          for (x = o = 0, ref2 = j; 0 <= ref2 ? o <= ref2 : o >= ref2; x = 0 <= ref2 ? ++o : --o) {
            if (arr[i][x] !== arr[i + len][x]) {
              stop = true;
            }
          }
          if (stop) {
            break;
          }
          len++;
        }
        return len;
      };

      thead = document.createElement('thead');
      numMetrics = 1;
      tAggregator = pivotData.getAggregator([], []);
      if (tAggregator.multivalue) {
        numMetrics = Object.keys(tAggregator.multivalue()).length;
      }
      tr = document.createElement('tr');
      th = document.createElement('th');
      th.className = 'pvtAxisLabel';
      th.setAttribute('colspan', rowAttrs.length);
      th.setAttribute('rowspan', colAttrs.length + 1);
      tr.appendChild(th);
      for (j in colAttrs) {
        if (!hasProp.call(colAttrs, j)) continue;
        c = colAttrs[j];
        for (i in colKeys) {
          if (!hasProp.call(colKeys, i)) continue;
          colKey = colKeys[i];
          x = spanSize(colKeys, parseInt(i), parseInt(j));
          if (x === 1) {
            x = numMetrics;
          }
          else {
            if (x !== -1 && numMetrics > 1) {
              x = x * numMetrics;
            }
          }
          if (x !== -1) {
            th = document.createElement('th');
            th.className = 'pvtColLabel';
            th.textContent = colKey[j];
            th.setAttribute('colspan', x);
            if (parseInt(j) === colAttrs.length - 1 && rowAttrs.length !== 0) {
              th.setAttribute('rowspan', 1);
            }
            tr.appendChild(th);
          }
        }
        if (parseInt(j) === 0) {
          if (colKeys.length > 1) {
            th = document.createElement('th');
            th.className = 'pvtTotalLabel pvtRowTotalLabel';
            th.innerHTML = opts.localeStrings.totals;
            th.setAttribute('colspan', numMetrics);
            th.setAttribute('rowspan', colAttrs.length + 1);
            tr.appendChild(th);
          }
        }
        thead.appendChild(tr);
        result.appendChild(thead);
        tr = document.createElement('tr');

        if (parseInt(j) === colAttrs.length - 1) {
          for (i in colKeys) {
            if (!hasProp.call(colKeys, i)) continue;
            colKey = colKeys[i];
            ref1 = Object.keys(tAggregator.multivalue());
            for (l = 0, len1 = ref1.length; l < len1; l++) {
              m = ref1[l];
              th = document.createElement('th');
              th.className = 'pvtColLabel';
              th.textContent = m;
              th.setAttribute('colspan', 1);
              if (parseInt(j) === colAttrs.length - 1 && rowAttrs.length !== 0) {
                th.setAttribute('rowspan', 1);
              }
              tr.appendChild(th);
            }
          }
          thead.appendChild(tr);
          result.appendChild(thead);
        }
      }
      if (colAttrs.length === 0) {
        tr = document.createElement('tr');
        th = document.createElement('th');
        th.className = 'pvtAxisLabel';
        th.setAttribute('colspan', rowAttrs.length);
        th.setAttribute('rowspan', colAttrs.length + 1);
        tr.appendChild(th);

        ref2 = Object.keys(tAggregator.multivalue());
        for (o = 0, len2 = ref2.length; o < len2; o++) {
          m = ref2[o];
          th = document.createElement('th');
          th.className = 'pvtColLabel';
          th.textContent = m;
          th.setAttribute('colspan', 1);
          tr.appendChild(th);
        }
        if (colKeys.length > 1) {
          th = document.createElement('th');
          th.innerHTML = 'Total';
          th.className = 'pvtTotalLabel pvtTotalCol';
          th.rowSpan = numMetrics;
          th.colSpan = numMetrics;
          tr.appendChild(th);
        }

        thead.appendChild(tr);
        result.appendChild(thead);
      }
      tbody = document.createElement('tbody');
      for (i in rowKeys) {
        if (!hasProp.call(rowKeys, i)) continue;
        rowKey = rowKeys[i];
        tr = document.createElement('tr');
        for (j in rowKey) {
          if (!hasProp.call(rowKey, j)) continue;
          txt = rowKey[j];
          x = spanSize(rowKeys, parseInt(i), parseInt(j));
          if (x !== -1) {
            th = document.createElement('th');
            th.className = 'pvtRowLabel';
            th.textContent = txt;
            th.setAttribute('rowspan', x);
            if (parseInt(j) === rowAttrs.length - 1 && colAttrs.length !== 0) {
              th.setAttribute('colspan', 1);
              th.className = 'pvtRowLabel';
            }
            tr.appendChild(th);
          }
        }

        for (j in colKeys) {
          if (!hasProp.call(colKeys, j)) continue;
          colKey = colKeys[j];
          aggregator = pivotData.getAggregator(rowKey, colKey);
          if (aggregator.multivalue) {
            ref3 = Object.keys(aggregator.multivalue());
            for (mc in ref3) {
              if (!hasProp.call(ref3, mc)) continue;
              m = ref3[mc];
              td = document.createElement('td');
              td.className = 'pvtVal';
              td.textContent = aggregator.format(aggregator.multivalue()[m]);
              td.innerHTML = aggregator.format(aggregator.multivalue()[m]);
              td.setAttribute('data-value', aggregator.format(aggregator.multivalue()[m]));
              tr.className = 'pvtValMKPI';
              tr.appendChild(td);
            }
          } else {
            for (q = 0, len3 = numMetrics; q < len3; q++) {
              td = document.createElement('td');
              td.className = 'pvtVal';
              tr.appendChild(td);
            }
          }
        }
        if (colAttrs.length === 0) {
          aggregator = pivotData.getAggregator(rowKey, []);
          ref4 = Object.keys(aggregator.multivalue());
          for (s = 0, len4 = ref4.length; s < len4; s++) {
            m = ref4[s];
            td = document.createElement('td');
            td.className = 'pvtVal';
            td.innerHTML = aggregator.format(aggregator.multivalue()[m]);
            td.textContent = aggregator.format(aggregator.multivalue()[m]);
            td.setAttribute('data-value', aggregator.multivalue()[m]);
            tr.appendChild(td);
          }
        }
        totalsAgg = pivotData.getAggregator(rowKey, []);
        val = 0;
        td = document.createElement('td');
        td.className = 'pvtTotal rowTotal ';
        ref5 = Object.keys(totalsAgg.multivalue());
        for (mc in ref5) {
          if (!hasProp.call(ref5, mc)) continue;
          m = ref5[mc];
          val = totalsAgg.multivalue()[m];
          if (colKeys.length > 1) {
            td = document.createElement('td');
            td.className = 'pvtTotal rowTotal';
            td.textContent = totalsAgg.format(val);
            td.setAttribute('data-value', val);
            td.setAttribute('data-for', 'row' + i);
            tr.appendChild(td);
          }
          tbody.appendChild(tr);
        }
        result.appendChild(tbody);
      }
      tr = document.createElement('tr');
      th = document.createElement('th');
      th.className = 'pvtTotalLabel';
      th.innerHTML = opts.localeStrings.totals;
      th.setAttribute('colspan', rowAttrs.length);
      tr.appendChild(th);
      for (j in colKeys) {
        if (!hasProp.call(colKeys, j)) continue;
        colKey = colKeys[j];
        totalsAgg = pivotData.getAggregator([], colKey);
        val = totalsAgg.multivalue();
        ref6 = Object.keys(val);
        for (u = 0, len6 = ref6.length; u < len6; u++) {
          m = ref6[u];
          td = document.createElement('td');
          td.className = 'pvtTotal colTotal';
          td.innerHTML = totalsAgg.format(val[m]);
          td.setAttribute('data-value', val[m]);
          td.setAttribute('data-for', 'col' + j);
          tr.appendChild(td);
        }
      }
      if (colAttrs.length === 0) {
        aggregator = pivotData.getAggregator([], []);
        ref7 = Object.keys(aggregator.multivalue());
        for (w = 0, len7 = ref7.length; w < len7; w++) {
          m = ref7[w];
          td = document.createElement('td');
          td.className = 'pvtVal';
          td.innerHTML = aggregator.format(aggregator.multivalue()[m]);
          td.setAttribute('data-value', aggregator.multivalue()[m]);
          tr.appendChild(td);
        }
      }
      totalsAgg = pivotData.getAggregator([], []);
      val = 0;
      ref8 = Object.keys(totalsAgg.multivalue());
      for (mc in ref8) {
        if (!hasProp.call(ref8, mc)) continue;
        m = ref8[mc];
        val = totalsAgg.multivalue()[m];
        if (colKeys.length > 1) {
          td = document.createElement('td');
          td.className = 'pvtGrandTotal ';
          td.textContent = totalsAgg.format(val);
          td.setAttribute('data-value', val);
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
        result.appendChild(tbody);
        result.setAttribute('data-numrows', rowKeys.length);
        result.setAttribute('data-numcols', colKeys.length);
      }
      return result;
    };

    /*
    Pivot Table core: create PivotData object and call Renderer on it
     */
    $.fn.pivot = function (input, opts) {
      var defaults, e, pivotData, result, x;
      defaults = {
        cols: [],
        rows: [],
        vals: [],
        dataClass: PivotData,
        filter: function () {
          return true;
        },
        aggregator: aggregatorTemplates.count()(),
        aggregatorName: 'Count',
        sorters: function () { },
        derivedAttributes: {},
        renderer: pivotTableRenderer,
        rendererOptions: null,
        localeStrings: locales.en.localeStrings
      };
      opts = $.extend(defaults, opts);
      result = null;
      try {
        pivotData = new opts.dataClass(input, opts);
        try {
          result = opts.renderer(pivotData, opts.rendererOptions);
        } catch (error) {
          e = error;
          if (typeof console !== 'undefined' && console !== null) {
            console.error(e.stack);
          }
          result = $('<span>').html(opts.localeStrings.renderError);
        }
      } catch (error) {
        e = error;
        if (typeof console !== 'undefined' && console !== null) {
          console.error(e.stack);
        }
        result = $('<span>').html(opts.localeStrings.computeError);
      }
      x = this[0];
      while (x.hasChildNodes()) {
        x.removeChild(x.lastChild);
      }
      return this.append(result);
    };

    /*
    Pivot Table UI: calls Pivot Table core above with options set by user
     */
    $.fn.pivotUI = function (input, inputOpts, overwrite, locale) {
      var a, aggregator, attrLength, axisValues, c, colList, defaults, e, existingOpts, fn, i, initialRender, k, l, len1, len2, len3, len4, o, opts, pivotTable, q, ref1, ref2, ref3, ref4, ref5, refresh, refreshDelayed, renderer, rendererControl, s, shownAttributes, tblCols, tr1, tr2, uiTable, unusedAttrsVerticalAutoCutoff, unusedAttrsVerticalAutoOverride, x;
      if (overwrite == null) {
        overwrite = false;
      }
      if (locale == null) {
        locale = 'en';
      }
      if (locales[locale] == null) {
        locale = 'en';
      }
      defaults = {
        derivedAttributes: {},
        aggregators: locales[locale].aggregators,
        renderers: locales[locale].renderers,
        hiddenAttributes: [],
        menuLimit: 200,
        cols: [],
        rows: [],
        vals: [],
        dataClass: PivotData,
        exclusions: {},
        inclusions: {},
        unusedAttrsVertical: 85,
        autoSortUnusedAttrs: false,
        rendererOptions: {
          localeStrings: locales[locale].localeStrings,
          metricConfig: {}
        },
        onRefresh: null,
        filter: function () {
          return true;
        },
        sorters: function () { },
        localeStrings: locales[locale].localeStrings,
      };
      existingOpts = this.data('pivotUIOptions');
      if ((existingOpts == null) || overwrite) {
        opts = $.extend(defaults, inputOpts);
      } else {
        opts = existingOpts;
      }
      try {
        input = PivotData.convertToArray(input);
        tblCols = (function () {
          var ref1, results;
          ref1 = input[0];
          results = [];
          for (k in ref1) {
            if (!hasProp.call(ref1, k)) continue;
            results.push(k);
          }
          return results;
        })();
        ref1 = opts.derivedAttributes;
        for (c in ref1) {
          if (!hasProp.call(ref1, c)) continue;
          if ((indexOf.call(tblCols, c) < 0)) {
            tblCols.push(c);
          }
        }
        axisValues = {};
        for (l = 0, len1 = tblCols.length; l < len1; l++) {
          x = tblCols[l];
          axisValues[x] = {};
        }
        PivotData.forEachRecord(input, opts.derivedAttributes, function (record) {
          var base, results, v;
          results = [];
          for (k in record) {
            if (!hasProp.call(record, k)) continue;
            v = record[k];
            if (v !== '') {
              if (axisValues[k]) {
                if (axisValues[k][v] !== undefined) {
                  if (!(opts.filter(record))) {
                    continue;
                  }
                  if (v == null) {
                    v = 'null';
                  }
                  if ((base = axisValues[k])[v] == null) {
                    base[v] = 0;
                  }
                  results.push(axisValues[k][v]++);
                }
              }

            }
          }
          return results;
        });
        uiTable = $('<table>', {
          'class': 'pvtUi'
        }).attr('cellpadding', 5);

        rendererControl = $('<td>');
        renderer = $('<select>').addClass('pvtRenderer').appendTo(rendererControl).bind('change', function () {
          return refresh();
        });
        ref2 = opts.renderers;
        for (x in ref2) {
          if (!hasProp.call(ref2, x)) continue;
          $('<option>').val(x).html(x).appendTo(renderer);
        }
        colList = $('<td>').addClass('pvtAxisContainer pvtUnused');
        shownAttributes = (function () {
          var len2, o, results;
          results = [];
          for (o = 0, len2 = tblCols.length; o < len2; o++) {
            c = tblCols[o];
            if (indexOf.call(opts.hiddenAttributes, c) < 0) {
              results.push(c);
            }
          }
          return results;
        })();
        unusedAttrsVerticalAutoOverride = false;
        if (opts.unusedAttrsVertical === 'auto') {
          unusedAttrsVerticalAutoCutoff = 120;
        } else {
          unusedAttrsVerticalAutoCutoff = parseInt(opts.unusedAttrsVertical);
        }
        if (!isNaN(unusedAttrsVerticalAutoCutoff)) {
          attrLength = 0;
          for (o = 0, len2 = shownAttributes.length; o < len2; o++) {
            a = shownAttributes[o];
            attrLength += a.length;
          }
          unusedAttrsVerticalAutoOverride = attrLength > unusedAttrsVerticalAutoCutoff;
        }
        fn = function (c) {
          var attrElem, btns, checkContainer, filterItem, filterItemExcluded, hasExcludedItem, keys, len3, q, ref3, showFilterList, triangleLink, updateFilter, v, valueList;
          keys = (function () {
            var results;
            results = [];
            for (k in axisValues[c]) {
              results.push(k);
            }
            return results;
          })();
          hasExcludedItem = false;
          valueList = $('<div>').addClass('pvtFilterBox').hide();
          valueList.append($('<h4>').text(c + ' (' + keys.length + ')'));
          if (keys.length > opts.menuLimit) {
            valueList.append($('<p>').html(opts.localeStrings.tooMany));
          } else {
            btns = $('<p>').appendTo(valueList);
            btns.append($('<button>', {
              type: 'button'
            }).html(opts.localeStrings.selectAll).bind('click', function () {
              return valueList.find('input:visible').prop('checked', true);
            }));
            btns.append($('<button>', {
              type: 'button'
            }).html(opts.localeStrings.selectNone).bind('click', function () {
              return valueList.find('input:visible').prop('checked', false);
            }));
            btns.append($('<br>'));
            btns.append($('<input>', {
              type: 'text',
              placeholder: opts.localeStrings.filterResults,
              'class': 'pvtSearch'
            }).bind('keyup', function () {
              var filter;
              filter = $(this).val().toLowerCase();
              return valueList.find('.pvtCheckContainer p').each(function () {
                var testString;
                testString = $(this).text().toLowerCase().indexOf(filter);
                if (testString !== -1) {
                  return $(this).show();
                } else {
                  return $(this).hide();
                }
              });
            }));
            checkContainer = $('<div>').addClass('pvtCheckContainer').appendTo(valueList);
            ref3 = keys.sort(getSort(opts.sorters, c));
            for (q = 0, len3 = ref3.length; q < len3; q++) {
              k = ref3[q];
              v = axisValues[c][k];
              filterItem = $('<label>');
              filterItemExcluded = false;
              if (opts.inclusions[c]) {
                filterItemExcluded = (indexOf.call(opts.inclusions[c], k) < 0);
              } else if (opts.exclusions[c]) {
                filterItemExcluded = (indexOf.call(opts.exclusions[c], k) >= 0);
              }
              hasExcludedItem || (hasExcludedItem = filterItemExcluded);
              $('<input>').attr('type', 'checkbox').addClass('pvtFilter').attr('checked', !filterItemExcluded).data('filter', [c, k]).appendTo(filterItem);
              filterItem.append($('<span>').text(k));
              filterItem.append($('<span>').text(' (' + v + ')'));
              checkContainer.append($('<p>').append(filterItem));
            }
          }
          updateFilter = function () {
            var unselectedCount;
            unselectedCount = valueList.find("[type='checkbox']").length - valueList.find("[type='checkbox']:checked").length;
            if (unselectedCount > 0) {
              attrElem.addClass('pvtFilteredAttribute');
            } else {
              attrElem.removeClass('pvtFilteredAttribute');
            }
            if (keys.length > opts.menuLimit) {
              return valueList.toggle();
            } else {
              return valueList.toggle(0, refresh);
            }
          };
          $('<p>').appendTo(valueList).append($('<button>', {
            type: 'button'
          }).text('OK').bind('click', updateFilter));
          showFilterList = function (e) {
            var clickLeft, clickTop, ref4;
            ref4 = $(e.currentTarget).position(), clickLeft = ref4.left, clickTop = ref4.top;
            valueList.css({
              left: clickLeft + 10,
              top: clickTop + 10
            }).toggle();
            valueList.find('.pvtSearch').val('');
            return valueList.find('.pvtCheckContainer p').show();
          };
          attrElem = $('<li>').addClass('axis_' + i).append($('<span>').addClass('pvtAttr').text(c).data('attrName', c).append(triangleLink));
          if (hasExcludedItem) {
            attrElem.addClass('pvtFilteredAttribute');
          }
          colList.append(attrElem).append(valueList);
          return attrElem.bind('dblclick', showFilterList);
        };
        for (i in shownAttributes) {
          if (!hasProp.call(shownAttributes, i)) continue;
          c = shownAttributes[i];
          fn(c);
        }
        tr1 = $('<tr>').appendTo(uiTable);
        aggregator = $('<select>').addClass('pvtAggregator').bind('change', function () {
          return refresh();
        });
        ref3 = opts.aggregators;
        for (x in ref3) {
          if (!hasProp.call(ref3, x)) continue;
          aggregator.append($('<option>').val(x).html(x));
        }
        $('<td>').addClass('pvtVals attrHide').appendTo(tr1).append(aggregator).append($('<br>'));
        $('<td>').addClass('pvtAxisContainer pvtHorizList pvtCols attrHide').appendTo(tr1);
        tr2 = $('<tr>').appendTo(uiTable);
        tr2.append($('<td>').addClass('pvtAxisContainer pvtRows attrHide').attr('valign', 'top'));
        pivotTable = $('<td>').attr('valign', 'top').addClass('pvtRendererArea').appendTo(tr2);
        if (opts.unusedAttrsVertical === true || unusedAttrsVerticalAutoOverride) {
          uiTable.find('tr:nth-child(1)').prepend(rendererControl);
          uiTable.find('tr:nth-child(2)').prepend(colList);
        } else {
          uiTable.prepend($('<tr>').append(rendererControl).append(colList));
        }
        this.html(uiTable);
        ref4 = opts.cols;
        for (q = 0, len3 = ref4.length; q < len3; q++) {
          x = ref4[q];
          this.find('.pvtCols').append(this.find('.axis_' + ($.inArray(x, shownAttributes))));
        }
        ref5 = opts.rows;
        for (s = 0, len4 = ref5.length; s < len4; s++) {
          x = ref5[s];
          this.find('.pvtRows').append(this.find('.axis_' + ($.inArray(x, shownAttributes))));
        }
        if (opts.aggregatorName != null) {
          this.find('.pvtAggregator').val(opts.aggregatorName);
        }
        if (opts.rendererName != null) {
          this.find('.pvtRenderer').val(opts.rendererName);
        }
        initialRender = true;
        refreshDelayed = (function (_this) {
          return function () {
            var attr, exclusions, inclusions, len5, newDropdown, numInputsToProcess, pivotUIOptions, pvtVals, ref6, ref7, subopts, t, u, unusedAttrsContainer, vals;
            subopts = {
              derivedAttributes: opts.derivedAttributes,
              localeStrings: opts.localeStrings,
              rendererOptions: opts.rendererOptions,
              sorters: opts.sorters,
              cols: [],
              rows: [],
              dataClass: opts.dataClass
            };
            numInputsToProcess = (ref6 = opts.aggregators[aggregator.val()]([])().numInputs) != null ? ref6 : 0;
            vals = [];
            _this.find('.pvtRows li span.pvtAttr').each(function () {
              return subopts.rows.push($(this).data('attrName'));
            });
            _this.find('.pvtCols li span.pvtAttr').each(function () {
              return subopts.cols.push($(this).data('attrName'));
            });
            _this.find('.pvtVals select.pvtAttrDropdown').each(function () {
              if (numInputsToProcess === 0) {
                return $(this).remove();
              } else {
                numInputsToProcess--;
                if ($(this).val() !== '') {
                  return vals.push($(this).val());
                }
              }
            });
            if (numInputsToProcess !== 0) {
              pvtVals = _this.find('.pvtVals');
              for (x = t = 0, ref7 = numInputsToProcess; 0 <= ref7 ? t < ref7 : t > ref7; x = 0 <= ref7 ? ++t : --t) {
                newDropdown = $('<select>').addClass('pvtAttrDropdown attrHide').append($('<option>')).bind('change', function () {
                  return refresh();
                });
                for (u = 0, len5 = shownAttributes.length; u < len5; u++) {
                  attr = shownAttributes[u];
                  newDropdown.append($('<option>').val(attr).text(attr));
                }
                pvtVals.append(newDropdown);
              }
            }
            if (initialRender) {
              vals = opts.vals;
              i = 0;
              _this.find('.pvtVals select.pvtAttrDropdown').each(function () {
                $(this).val(vals[i]);
                return i++;
              });
              initialRender = false;
            }
            subopts.aggregatorName = aggregator.val();
            subopts.vals = vals;
            subopts.aggregator = opts.aggregators[aggregator.val()](vals);
            subopts.renderer = opts.renderers[renderer.val()];
            exclusions = {};
            _this.find('input.pvtFilter').not(':checked').each(function () {
              var filter;
              filter = $(this).data('filter');
              if (exclusions[filter[0]] != null) {
                return exclusions[filter[0]].push(filter[1]);
              } else {
                return exclusions[filter[0]] = [filter[1]];
              }
            });
            inclusions = {};
            _this.find('input.pvtFilter:checked').each(function () {
              var filter;
              filter = $(this).data('filter');
              if (exclusions[filter[0]] != null) {
                if (inclusions[filter[0]] != null) {
                  return inclusions[filter[0]].push(filter[1]);
                } else {
                  return inclusions[filter[0]] = [filter[1]];
                }
              }
            });
            subopts.filter = function (record) {
              var excludedItems, ref8;
              if (!opts.filter(record)) {
                return false;
              }
              for (k in exclusions) {
                excludedItems = exclusions[k];
                if (ref8 = '' + record[k], indexOf.call(excludedItems, ref8) >= 0) {
                  return false;
                }
              }
              return true;
            };
            pivotTable.pivot(input, subopts);
            pivotUIOptions = $.extend(opts, {
              cols: subopts.cols,
              rows: subopts.rows,
              vals: vals,
              exclusions: exclusions,
              inclusions: inclusions,
              inclusionsInfo: inclusions,
              aggregatorName: aggregator.val(),
              rendererName: renderer.val()
            });
            _this.data('pivotUIOptions', pivotUIOptions);
            if (opts.autoSortUnusedAttrs) {
              unusedAttrsContainer = _this.find('td.pvtUnused.pvtAxisContainer');
              $(unusedAttrsContainer).children('li').sort(function (a, b) {
                return naturalSort($(a).text(), $(b).text());
              }).appendTo(unusedAttrsContainer);
            }
            pivotTable.css('opacity', 1);
            if (opts.onRefresh != null) {
              return opts.onRefresh(pivotUIOptions);
            }
          };
        })(this);
        refresh = (function (_this) {
          return function () {
            pivotTable.css('opacity', 0.5);
            return setTimeout(refreshDelayed, 10);
          };
        })(this);
        refresh();
        this.find('.pvtAxisContainer').sortable({
          update: function (e, ui) {
            if (ui.sender == null) {
              return refresh();
            }
          },
          connectWith: this.find('.pvtAxisContainer'),
          items: 'li',
          placeholder: 'pvtPlaceholder'
        });
      } catch (error) {
        e = error;
        if (typeof console !== 'undefined' && console !== null) {
          console.error(e.stack);
        }
        this.html(opts.localeStrings.uiRenderError);
      }
      return this;
    };
  });
}).call(this);
