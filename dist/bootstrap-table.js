/**
 * NB: If the bootstrap table file in node_modules is lost then we need to update it with this one
 * TODO: Low. Probably best to fork the repo at some point
 * It's the core with the export plugin
 * Changed buttons to include required text in a span.text
 */

 /**
  * @author zhixin wen <wenzhixin2010@gmail.com>
  * version: 1.11.1
  * https://github.com/wenzhixin/bootstrap-table/
  */

 (function ($) {
     'use strict';

     // TOOLS DEFINITION
     // ======================

     var cachedWidth = null;

     // it only does '%s', and return '' when arguments are undefined
     var sprintf = function (str) {
         var args = arguments,
             flag = true,
             i = 1;

         str = str.replace(/%s/g, function () {
             var arg = args[i++];

             if (typeof arg === 'undefined') {
                 flag = false;
                 return '';
             }
             return arg;
         });
         return flag ? str : '';
     };

     var getPropertyFromOther = function (list, from, to, value) {
         var result = '';
         $.each(list, function (i, item) {
             if (item[from] === value) {
                 result = item[to];
                 return false;
             }
             return true;
         });
         return result;
     };

     var getFieldIndex = function (columns, field) {
         var index = -1;

         $.each(columns, function (i, column) {
             if (column.field === field) {
                 index = i;
                 return false;
             }
             return true;
         });
         return index;
     };

     // http://jsfiddle.net/wenyi/47nz7ez9/3/
     var setFieldIndex = function (columns) {
         var i, j, k,
             totalCol = 0,
             flag = [];

         for (i = 0; i < columns[0].length; i++) {
             totalCol += columns[0][i].colspan || 1;
         }

         for (i = 0; i < columns.length; i++) {
             flag[i] = [];
             for (j = 0; j < totalCol; j++) {
                 flag[i][j] = false;
             }
         }

         for (i = 0; i < columns.length; i++) {
             for (j = 0; j < columns[i].length; j++) {
                 var r = columns[i][j],
                     rowspan = r.rowspan || 1,
                     colspan = r.colspan || 1,
                     index = $.inArray(false, flag[i]);

                 if (colspan === 1) {
                     r.fieldIndex = index;
                     // when field is undefined, use index instead
                     if (typeof r.field === 'undefined') {
                         r.field = index;
                     }
                 }

                 for (k = 0; k < rowspan; k++) {
                     flag[i + k][index] = true;
                 }
                 for (k = 0; k < colspan; k++) {
                     flag[i][index + k] = true;
                 }
             }
         }
     };

     var getScrollBarWidth = function () {
         if (cachedWidth === null) {
             var inner = $('<p/>').addClass('fixed-table-scroll-inner'),
                 outer = $('<div/>').addClass('fixed-table-scroll-outer'),
                 w1, w2;

             outer.append(inner);
             $('body').append(outer);

             w1 = inner[0].offsetWidth;
             outer.css('overflow', 'scroll');
             w2 = inner[0].offsetWidth;

             if (w1 === w2) {
                 w2 = outer[0].clientWidth;
             }

             outer.remove();
             cachedWidth = w1 - w2;
         }
         return cachedWidth;
     };

     var calculateObjectValue = function (self, name, args, defaultValue) {
         var func = name;

         if (typeof name === 'string') {
             // support obj.func1.func2
             var names = name.split('.');

             if (names.length > 1) {
                 func = window;
                 $.each(names, function (i, f) {
                     func = func[f];
                 });
             } else {
                 func = window[name];
             }
         }
         if (typeof func === 'object') {
             return func;
         }
         if (typeof func === 'function') {
             return func.apply(self, args || []);
         }
         if (!func && typeof name === 'string' && sprintf.apply(this, [name].concat(args))) {
             return sprintf.apply(this, [name].concat(args));
         }
         return defaultValue;
     };

     var compareObjects = function (objectA, objectB, compareLength) {
         // Create arrays of property names
         var objectAProperties = Object.getOwnPropertyNames(objectA),
             objectBProperties = Object.getOwnPropertyNames(objectB),
             propName = '';

         if (compareLength) {
             // If number of properties is different, objects are not equivalent
             if (objectAProperties.length !== objectBProperties.length) {
                 return false;
             }
         }

         for (var i = 0; i < objectAProperties.length; i++) {
             propName = objectAProperties[i];

             // If the property is not in the object B properties, continue with the next property
             if ($.inArray(propName, objectBProperties) > -1) {
                 // If values of same property are not equal, objects are not equivalent
                 if (objectA[propName] !== objectB[propName]) {
                     return false;
                 }
             }
         }

         // If we made it this far, objects are considered equivalent
         return true;
     };

     var escapeHTML = function (text) {
         if (typeof text === 'string') {
             return text
                 .replace(/&/g, '&amp;')
                 .replace(/</g, '&lt;')
                 .replace(/>/g, '&gt;')
                 .replace(/"/g, '&quot;')
                 .replace(/'/g, '&#039;')
                 .replace(/`/g, '&#x60;');
         }
         return text;
     };

     var getRealDataAttr = function (dataAttr) {
         for (var attr in dataAttr) {
             var auxAttr = attr.split(/(?=[A-Z])/).join('-').toLowerCase();
             if (auxAttr !== attr) {
                 dataAttr[auxAttr] = dataAttr[attr];
                 delete dataAttr[attr];
             }
         }

         return dataAttr;
     };

     var getItemField = function (item, field, escape) {
         var value = item;

         if (typeof field !== 'string' || item.hasOwnProperty(field)) {
             return escape ? escapeHTML(item[field]) : item[field];
         }
         var props = field.split('.');
         for (var p in props) {
             if (props.hasOwnProperty(p)) {
                 value = value && value[props[p]];
             }
         }
         return escape ? escapeHTML(value) : value;
     };

     var isIEBrowser = function () {
         return !!(navigator.userAgent.indexOf("MSIE ") > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./));
     };

     var objectKeys = function () {
         // From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
         if (!Object.keys) {
             Object.keys = (function() {
                 var hasOwnProperty = Object.prototype.hasOwnProperty,
                     hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
                     dontEnums = [
                         'toString',
                         'toLocaleString',
                         'valueOf',
                         'hasOwnProperty',
                         'isPrototypeOf',
                         'propertyIsEnumerable',
                         'constructor'
                     ],
                     dontEnumsLength = dontEnums.length;

                 return function(obj) {
                     if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
                         throw new TypeError('Object.keys called on non-object');
                     }

                     var result = [], prop, i;

                     for (prop in obj) {
                         if (hasOwnProperty.call(obj, prop)) {
                             result.push(prop);
                         }
                     }

                     if (hasDontEnumBug) {
                         for (i = 0; i < dontEnumsLength; i++) {
                             if (hasOwnProperty.call(obj, dontEnums[i])) {
                                 result.push(dontEnums[i]);
                             }
                         }
                     }
                     return result;
                 };
             }());
         }
     };

     // BOOTSTRAP TABLE CLASS DEFINITION
     // ======================

     var BootstrapTable = function (el, options) {
         this.options = options;
         this.$el = $(el);
         this.$el_ = this.$el.clone();
         this.timeoutId_ = 0;
         this.timeoutFooter_ = 0;

         this.init();
     };

     BootstrapTable.DEFAULTS = {
         classes: 'table table-hover',
         sortClass: undefined,
         locale: undefined,
         height: undefined,
         undefinedText: '-',
         sortName: undefined,
         sortOrder: 'asc',
         sortStable: false,
         striped: false,
         columns: [[]],
         data: [],
         totalField: 'total',
         dataField: 'rows',
         method: 'get',
         url: undefined,
         ajax: undefined,
         cache: true,
         contentType: 'application/json',
         dataType: 'json',
         ajaxOptions: {},
         queryParams: function (params) {
             return params;
         },
         queryParamsType: 'limit', // undefined
         responseHandler: function (res) {
             return res;
         },
         pagination: false,
         onlyInfoPagination: false,
         paginationLoop: true,
         sidePagination: 'client', // client or server
         totalRows: 0, // server side need to set
         pageNumber: 1,
         pageSize: 10,
         pageList: [10, 25, 50, 100],
         paginationHAlign: 'right', //right, left
         paginationVAlign: 'bottom', //bottom, top, both
         paginationDetailHAlign: 'left', //right, left
         paginationPreText: '&lsaquo;',
         paginationNextText: '&rsaquo;',
         search: false,
         searchOnEnterKey: false,
         strictSearch: false,
         searchAlign: 'right',
         selectItemName: 'btSelectItem',
         showHeader: true,
         showFooter: false,
         showColumns: false,
         showPaginationSwitch: false,
         showRefresh: false,
         showToggle: false,
         buttonsAlign: 'right',
         smartDisplay: true,
         escape: false,
         minimumCountColumns: 1,
         idField: undefined,
         uniqueId: undefined,
         cardView: false,
         detailView: false,
         detailFormatter: function (index, row) {
             return '';
         },
         trimOnSearch: true,
         clickToSelect: false,
         singleSelect: false,
         toolbar: undefined,
         toolbarAlign: 'left',
         checkboxHeader: true,
         sortable: true,
         silentSort: true,
         maintainSelected: false,
         searchTimeOut: 500,
         searchText: '',
         iconSize: undefined,
         buttonsClass: 'default',
         iconsPrefix: 'glyphicon', // glyphicon of fa (font awesome)
         icons: {
             paginationSwitchDown: 'glyphicon-collapse-down icon-chevron-down',
             paginationSwitchUp: 'glyphicon-collapse-up icon-chevron-up',
             refresh: 'glyphicon-refresh icon-refresh',
             toggle: 'glyphicon-list-alt icon-list-alt',
             columns: 'glyphicon-th icon-th',
             detailOpen: 'glyphicon-plus icon-plus',
             detailClose: 'glyphicon-minus icon-minus'
         },

         customSearch: $.noop,

         customSort: $.noop,

         rowStyle: function (row, index) {
             return {};
         },

         rowAttributes: function (row, index) {
             return {};
         },

         footerStyle: function (row, index) {
             return {};
         },

         onAll: function (name, args) {
             return false;
         },
         onClickCell: function (field, value, row, $element) {
             return false;
         },
         onDblClickCell: function (field, value, row, $element) {
             return false;
         },
         onClickRow: function (item, $element) {
             return false;
         },
         onDblClickRow: function (item, $element) {
             return false;
         },
         onSort: function (name, order) {
             return false;
         },
         onCheck: function (row) {
             return false;
         },
         onUncheck: function (row) {
             return false;
         },
         onCheckAll: function (rows) {
             return false;
         },
         onUncheckAll: function (rows) {
             return false;
         },
         onCheckSome: function (rows) {
             return false;
         },
         onUncheckSome: function (rows) {
             return false;
         },
         onLoadSuccess: function (data) {
             return false;
         },
         onLoadError: function (status) {
             return false;
         },
         onColumnSwitch: function (field, checked) {
             return false;
         },
         onPageChange: function (number, size) {
             return false;
         },
         onSearch: function (text) {
             return false;
         },
         onToggle: function (cardView) {
             return false;
         },
         onPreBody: function (data) {
             return false;
         },
         onPostBody: function () {
             return false;
         },
         onPostHeader: function () {
             return false;
         },
         onExpandRow: function (index, row, $detail) {
             return false;
         },
         onCollapseRow: function (index, row) {
             return false;
         },
         onRefreshOptions: function (options) {
             return false;
         },
         onRefresh: function (params) {
           return false;
         },
         onResetView: function () {
             return false;
         }
     };

     BootstrapTable.LOCALES = {};

     BootstrapTable.LOCALES['en-US'] = BootstrapTable.LOCALES.en = {
         formatLoadingMessage: function () {
             return 'Loading, please wait...';
         },
         formatRecordsPerPage: function (pageNumber) {
             return sprintf('%s rows per page', pageNumber);
         },
         formatShowingRows: function (pageFrom, pageTo, totalRows) {
             return sprintf('Showing %s to %s of %s rows', pageFrom, pageTo, totalRows);
         },
         formatDetailPagination: function (totalRows) {
             return sprintf('Showing %s rows', totalRows);
         },
         formatSearch: function () {
             return 'Search';
         },
         formatNoMatches: function () {
             return 'No matching records found';
         },
         formatPaginationSwitch: function () {
             return 'Hide/Show pagination';
         },
         formatRefresh: function () {
             return 'Refresh';
         },
         formatToggle: function () {
             return 'Toggle';
         },
         formatColumns: function () {
             return 'Columns';
         },
         formatAllRows: function () {
             return 'All';
         }
     };

     $.extend(BootstrapTable.DEFAULTS, BootstrapTable.LOCALES['en-US']);

     BootstrapTable.COLUMN_DEFAULTS = {
         radio: false,
         checkbox: false,
         checkboxEnabled: true,
         field: undefined,
         title: undefined,
         titleTooltip: undefined,
         'class': undefined,
         align: undefined, // left, right, center
         halign: undefined, // left, right, center
         falign: undefined, // left, right, center
         valign: undefined, // top, middle, bottom
         width: undefined,
         sortable: false,
         order: 'asc', // asc, desc
         visible: true,
         switchable: true,
         clickToSelect: true,
         formatter: undefined,
         footerFormatter: undefined,
         events: undefined,
         sorter: undefined,
         sortName: undefined,
         cellStyle: undefined,
         searchable: true,
         searchFormatter: true,
         cardVisible: true,
         escape : false
     };

     BootstrapTable.EVENTS = {
         'all.bs.table': 'onAll',
         'click-cell.bs.table': 'onClickCell',
         'dbl-click-cell.bs.table': 'onDblClickCell',
         'click-row.bs.table': 'onClickRow',
         'dbl-click-row.bs.table': 'onDblClickRow',
         'sort.bs.table': 'onSort',
         'check.bs.table': 'onCheck',
         'uncheck.bs.table': 'onUncheck',
         'check-all.bs.table': 'onCheckAll',
         'uncheck-all.bs.table': 'onUncheckAll',
         'check-some.bs.table': 'onCheckSome',
         'uncheck-some.bs.table': 'onUncheckSome',
         'load-success.bs.table': 'onLoadSuccess',
         'load-error.bs.table': 'onLoadError',
         'column-switch.bs.table': 'onColumnSwitch',
         'page-change.bs.table': 'onPageChange',
         'search.bs.table': 'onSearch',
         'toggle.bs.table': 'onToggle',
         'pre-body.bs.table': 'onPreBody',
         'post-body.bs.table': 'onPostBody',
         'post-header.bs.table': 'onPostHeader',
         'expand-row.bs.table': 'onExpandRow',
         'collapse-row.bs.table': 'onCollapseRow',
         'refresh-options.bs.table': 'onRefreshOptions',
         'reset-view.bs.table': 'onResetView',
         'refresh.bs.table': 'onRefresh'
     };

     BootstrapTable.prototype.init = function () {
         this.initLocale();
         this.initContainer();
         this.initTable();
         this.initHeader();
         this.initData();
         this.initHiddenRows();
         this.initFooter();
         this.initToolbar();
         this.initPagination();
         this.initBody();
         this.initSearchText();
         this.initServer();
     };

     BootstrapTable.prototype.initLocale = function () {
         if (this.options.locale) {
             var parts = this.options.locale.split(/-|_/);
             parts[0].toLowerCase();
             if (parts[1]) parts[1].toUpperCase();
             if ($.fn.bootstrapTable.locales[this.options.locale]) {
                 // locale as requested
                 $.extend(this.options, $.fn.bootstrapTable.locales[this.options.locale]);
             } else if ($.fn.bootstrapTable.locales[parts.join('-')]) {
                 // locale with sep set to - (in case original was specified with _)
                 $.extend(this.options, $.fn.bootstrapTable.locales[parts.join('-')]);
             } else if ($.fn.bootstrapTable.locales[parts[0]]) {
                 // short locale language code (i.e. 'en')
                 $.extend(this.options, $.fn.bootstrapTable.locales[parts[0]]);
             }
         }
     };

     BootstrapTable.prototype.initContainer = function () {
         this.$container = $([
             '<div class="bootstrap-table">',
             '<div class="fixed-table-toolbar"></div>',
             this.options.paginationVAlign === 'top' || this.options.paginationVAlign === 'both' ?
                 '<div class="fixed-table-pagination" style="clear: both;"></div>' :
                 '',
             '<div class="fixed-table-container">',
             '<div class="fixed-table-header"><table></table></div>',
             '<div class="fixed-table-body">',
             '<div class="fixed-table-loading">',
             this.options.formatLoadingMessage(),
             '</div>',
             '</div>',
             '<div class="fixed-table-footer"><table><tr></tr></table></div>',
             this.options.paginationVAlign === 'bottom' || this.options.paginationVAlign === 'both' ?
                 '<div class="fixed-table-pagination"></div>' :
                 '',
             '</div>',
             '</div>'
         ].join(''));

         this.$container.insertAfter(this.$el);
         this.$tableContainer = this.$container.find('.fixed-table-container');
         this.$tableHeader = this.$container.find('.fixed-table-header');
         this.$tableBody = this.$container.find('.fixed-table-body');
         this.$tableLoading = this.$container.find('.fixed-table-loading');
         this.$tableFooter = this.$container.find('.fixed-table-footer');
         this.$toolbar = this.$container.find('.fixed-table-toolbar');
         this.$pagination = this.$container.find('.fixed-table-pagination');

         this.$tableBody.append(this.$el);
         this.$container.after('<div class="clearfix"></div>');

         this.$el.addClass(this.options.classes);
         if (this.options.striped) {
             this.$el.addClass('table-striped');
         }
         if ($.inArray('table-no-bordered', this.options.classes.split(' ')) !== -1) {
             this.$tableContainer.addClass('table-no-bordered');
         }
     };

     BootstrapTable.prototype.initTable = function () {
         var that = this,
             columns = [],
             data = [];

         this.$header = this.$el.find('>thead');
         if (!this.$header.length) {
             this.$header = $('<thead></thead>').appendTo(this.$el);
         }
         this.$header.find('tr').each(function () {
             var column = [];

             $(this).find('th').each(function () {
                 // Fix #2014 - getFieldIndex and elsewhere assume this is string, causes issues if not
                 if (typeof $(this).data('field') !== 'undefined') {
                     $(this).data('field', $(this).data('field') + '');
                 }
                 column.push($.extend({}, {
                     title: $(this).html(),
                     'class': $(this).attr('class'),
                     titleTooltip: $(this).attr('title'),
                     rowspan: $(this).attr('rowspan') ? +$(this).attr('rowspan') : undefined,
                     colspan: $(this).attr('colspan') ? +$(this).attr('colspan') : undefined
                 }, $(this).data()));
             });
             columns.push(column);
         });
         if (!$.isArray(this.options.columns[0])) {
             this.options.columns = [this.options.columns];
         }
         this.options.columns = $.extend(true, [], columns, this.options.columns);
         this.columns = [];

         setFieldIndex(this.options.columns);
         $.each(this.options.columns, function (i, columns) {
             $.each(columns, function (j, column) {
                 column = $.extend({}, BootstrapTable.COLUMN_DEFAULTS, column);

                 if (typeof column.fieldIndex !== 'undefined') {
                     that.columns[column.fieldIndex] = column;
                 }

                 that.options.columns[i][j] = column;
             });
         });

         // if options.data is setting, do not process tbody data
         if (this.options.data.length) {
             return;
         }

         var m = [];
         this.$el.find('>tbody>tr').each(function (y) {
             var row = {};

             // save tr's id, class and data-* attributes
             row._id = $(this).attr('id');
             row._class = $(this).attr('class');
             row._data = getRealDataAttr($(this).data());

             $(this).find('>td').each(function (x) {
                 var $this = $(this),
                     cspan = +$this.attr('colspan') || 1,
                     rspan = +$this.attr('rowspan') || 1,
                     tx, ty;

                 for (; m[y] && m[y][x]; x++); //skip already occupied cells in current row

                 for (tx = x; tx < x + cspan; tx++) { //mark matrix elements occupied by current cell with true
                     for (ty = y; ty < y + rspan; ty++) {
                         if (!m[ty]) { //fill missing rows
                             m[ty] = [];
                         }
                         m[ty][tx] = true;
                     }
                 }

                 var field = that.columns[x].field;

                 row[field] = $(this).html();
                 // save td's id, class and data-* attributes
                 row['_' + field + '_id'] = $(this).attr('id');
                 row['_' + field + '_class'] = $(this).attr('class');
                 row['_' + field + '_rowspan'] = $(this).attr('rowspan');
                 row['_' + field + '_colspan'] = $(this).attr('colspan');
                 row['_' + field + '_title'] = $(this).attr('title');
                 row['_' + field + '_data'] = getRealDataAttr($(this).data());
             });
             data.push(row);
         });
         this.options.data = data;
         if (data.length) this.fromHtml = true;
     };

     BootstrapTable.prototype.initHeader = function () {
         var that = this,
             visibleColumns = {},
             html = [];

         this.header = {
             fields: [],
             styles: [],
             classes: [],
             formatters: [],
             events: [],
             sorters: [],
             sortNames: [],
             cellStyles: [],
             searchables: []
         };

         $.each(this.options.columns, function (i, columns) {
             html.push('<tr>');

             if (i === 0 && !that.options.cardView && that.options.detailView) {
                 html.push(sprintf('<th class="detail" rowspan="%s"><div class="fht-cell"></div></th>',
                     that.options.columns.length));
             }

             $.each(columns, function (j, column) {
                 var text = '',
                     halign = '', // header align style
                     align = '', // body align style
                     style = '',
                     class_ = sprintf(' class="%s"', column['class']),
                     order = that.options.sortOrder || column.order,
                     unitWidth = 'px',
                     width = column.width;

                 if (column.width !== undefined && (!that.options.cardView)) {
                     if (typeof column.width === 'string') {
                         if (column.width.indexOf('%') !== -1) {
                             unitWidth = '%';
                         }
                     }
                 }
                 if (column.width && typeof column.width === 'string') {
                     width = column.width.replace('%', '').replace('px', '');
                 }

                 halign = sprintf('text-align: %s; ', column.halign ? column.halign : column.align);
                 align = sprintf('text-align: %s; ', column.align);
                 style = sprintf('vertical-align: %s; ', column.valign);
                 style += sprintf('width: %s; ', (column.checkbox || column.radio) && !width ?
                     '36px' : (width ? width + unitWidth : undefined));

                 if (typeof column.fieldIndex !== 'undefined') {
                     that.header.fields[column.fieldIndex] = column.field;
                     that.header.styles[column.fieldIndex] = align + style;
                     that.header.classes[column.fieldIndex] = class_;
                     that.header.formatters[column.fieldIndex] = column.formatter;
                     that.header.events[column.fieldIndex] = column.events;
                     that.header.sorters[column.fieldIndex] = column.sorter;
                     that.header.sortNames[column.fieldIndex] = column.sortName;
                     that.header.cellStyles[column.fieldIndex] = column.cellStyle;
                     that.header.searchables[column.fieldIndex] = column.searchable;

                     if (!column.visible) {
                         return;
                     }

                     if (that.options.cardView && (!column.cardVisible)) {
                         return;
                     }

                     visibleColumns[column.field] = column;
                 }

                 html.push('<th' + sprintf(' title="%s"', column.titleTooltip),
                     column.checkbox || column.radio ?
                         sprintf(' class="bs-checkbox %s"', column['class'] || '') :
                         class_,
                     sprintf(' style="%s"', halign + style),
                     sprintf(' rowspan="%s"', column.rowspan),
                     sprintf(' colspan="%s"', column.colspan),
                     sprintf(' data-field="%s"', column.field),
                     '>');

                 html.push(sprintf('<div class="th-inner %s">', that.options.sortable && column.sortable ?
                     'sortable both' : ''));

                 text = that.options.escape ? escapeHTML(column.title) : column.title;

                 if (column.checkbox) {
                     if (!that.options.singleSelect && that.options.checkboxHeader) {
                         text = '<input name="btSelectAll" type="checkbox" />';
                     }
                     that.header.stateField = column.field;
                 }
                 if (column.radio) {
                     text = '';
                     that.header.stateField = column.field;
                     that.options.singleSelect = true;
                 }

                 html.push(text);
                 html.push('</div>');
                 html.push('<div class="fht-cell"></div>');
                 html.push('</div>');
                 html.push('</th>');
             });
             html.push('</tr>');
         });

         this.$header.html(html.join(''));
         this.$header.find('th[data-field]').each(function (i) {
             $(this).data(visibleColumns[$(this).data('field')]);
         });
         this.$container.off('click', '.th-inner').on('click', '.th-inner', function (event) {
             var target = $(this);

             if (that.options.detailView) {
                 if (target.closest('.bootstrap-table')[0] !== that.$container[0])
                     return false;
             }

             if (that.options.sortable && target.parent().data().sortable) {
                 that.onSort(event);
             }
         });

         this.$header.children().children().off('keypress').on('keypress', function (event) {
             if (that.options.sortable && $(this).data().sortable) {
                 var code = event.keyCode || event.which;
                 if (code == 13) { //Enter keycode
                     that.onSort(event);
                 }
             }
         });

         $(window).off('resize.bootstrap-table');
         if (!this.options.showHeader || this.options.cardView) {
             this.$header.hide();
             this.$tableHeader.hide();
             this.$tableLoading.css('top', 0);
         } else {
             this.$header.show();
             this.$tableHeader.show();
             this.$tableLoading.css('top', this.$header.outerHeight() + 1);
             // Assign the correct sortable arrow
             this.getCaret();
             $(window).on('resize.bootstrap-table', $.proxy(this.resetWidth, this));
         }

         this.$selectAll = this.$header.find('[name="btSelectAll"]');
         this.$selectAll.off('click').on('click', function () {
                 var checked = $(this).prop('checked');
                 that[checked ? 'checkAll' : 'uncheckAll']();
                 that.updateSelected();
             });
     };

     BootstrapTable.prototype.initFooter = function () {
         if (!this.options.showFooter || this.options.cardView) {
             this.$tableFooter.hide();
         } else {
             this.$tableFooter.show();
         }
     };

     /**
      * @param data
      * @param type: append / prepend
      */
     BootstrapTable.prototype.initData = function (data, type) {
         if (type === 'append') {
             this.data = this.data.concat(data);
         } else if (type === 'prepend') {
             this.data = [].concat(data).concat(this.data);
         } else {
             this.data = data || this.options.data;
         }

         // Fix #839 Records deleted when adding new row on filtered table
         if (type === 'append') {
             this.options.data = this.options.data.concat(data);
         } else if (type === 'prepend') {
             this.options.data = [].concat(data).concat(this.options.data);
         } else {
             this.options.data = this.data;
         }

         if (this.options.sidePagination === 'server') {
             return;
         }
         this.initSort();
     };

     BootstrapTable.prototype.initSort = function () {
         var that = this,
             name = this.options.sortName,
             order = this.options.sortOrder === 'desc' ? -1 : 1,
             index = $.inArray(this.options.sortName, this.header.fields),
             timeoutId = 0;

         if (this.options.customSort !== $.noop) {
             this.options.customSort.apply(this, [this.options.sortName, this.options.sortOrder]);
             return;
         }

         if (index !== -1) {
             if (this.options.sortStable) {
                 $.each(this.data, function (i, row) {
                     if (!row.hasOwnProperty('_position')) row._position = i;
                 });
             }

             this.data.sort(function (a, b) {
                 if (that.header.sortNames[index]) {
                     name = that.header.sortNames[index];
                 }
                 var aa = getItemField(a, name, that.options.escape),
                     bb = getItemField(b, name, that.options.escape),
                     value = calculateObjectValue(that.header, that.header.sorters[index], [aa, bb]);

                 if (value !== undefined) {
                     return order * value;
                 }

                 // Fix #161: undefined or null string sort bug.
                 if (aa === undefined || aa === null) {
                     aa = '';
                 }
                 if (bb === undefined || bb === null) {
                     bb = '';
                 }

                 if (that.options.sortStable && aa === bb) {
                     aa = a._position;
                     bb = b._position;
                 }

                 // IF both values are numeric, do a numeric comparison
                 if ($.isNumeric(aa) && $.isNumeric(bb)) {
                     // Convert numerical values form string to float.
                     aa = parseFloat(aa);
                     bb = parseFloat(bb);
                     if (aa < bb) {
                         return order * -1;
                     }
                     return order;
                 }

                 if (aa === bb) {
                     return 0;
                 }

                 // If value is not a string, convert to string
                 if (typeof aa !== 'string') {
                     aa = aa.toString();
                 }

                 if (aa.localeCompare(bb) === -1) {
                     return order * -1;
                 }

                 return order;
             });

             if (this.options.sortClass !== undefined) {
                 clearTimeout(timeoutId);
                 timeoutId = setTimeout(function () {
                     that.$el.removeClass(that.options.sortClass);
                     var index = that.$header.find(sprintf('[data-field="%s"]',
                         that.options.sortName).index() + 1);
                     that.$el.find(sprintf('tr td:nth-child(%s)', index))
                         .addClass(that.options.sortClass);
                 }, 250);
             }
         }
     };

     BootstrapTable.prototype.onSort = function (event) {
         var $this = event.type === "keypress" ? $(event.currentTarget) : $(event.currentTarget).parent(),
             $this_ = this.$header.find('th').eq($this.index());

         this.$header.add(this.$header_).find('span.order').remove();

         if (this.options.sortName === $this.data('field')) {
             this.options.sortOrder = this.options.sortOrder === 'asc' ? 'desc' : 'asc';
         } else {
             this.options.sortName = $this.data('field');
             this.options.sortOrder = $this.data('order') === 'asc' ? 'desc' : 'asc';
         }
         this.trigger('sort', this.options.sortName, this.options.sortOrder);

         $this.add($this_).data('order', this.options.sortOrder);

         // Assign the correct sortable arrow
         this.getCaret();

         if (this.options.sidePagination === 'server') {
             this.initServer(this.options.silentSort);
             return;
         }

         this.initSort();
         this.initBody();
     };

     BootstrapTable.prototype.initToolbar = function () {
         var that = this,
             html = [],
             timeoutId = 0,
             $keepOpen,
             $search,
             switchableCount = 0;

         if (this.$toolbar.find('.bs-bars').children().length) {
             $('body').append($(this.options.toolbar));
         }
         this.$toolbar.html('');

         if (typeof this.options.toolbar === 'string' || typeof this.options.toolbar === 'object') {
             $(sprintf('<div class="bs-bars pull-%s"></div>', this.options.toolbarAlign))
                 .appendTo(this.$toolbar)
                 .append($(this.options.toolbar));
         }

         // showColumns, showToggle, showRefresh
         html = [sprintf('<div class="columns columns-%s btn-group pull-%s">',
             this.options.buttonsAlign, this.options.buttonsAlign)];

         if (typeof this.options.icons === 'string') {
             this.options.icons = calculateObjectValue(null, this.options.icons);
         }

         if (this.options.showPaginationSwitch) {
             html.push(sprintf('<button class="btn' +
                     sprintf(' btn-%s', this.options.buttonsClass) +
                     sprintf(' btn-%s', this.options.iconSize) +
                     '" type="button" name="paginationSwitch" aria-label="pagination Switch" title="%s">',
                     this.options.formatPaginationSwitch()),
                 sprintf('<i class="%s %s"></i>', this.options.iconsPrefix, this.options.icons.paginationSwitchDown),
                 sprintf('<span class="text">%s</span>', this.options.formatPaginationSwitch()),
                 '</button>');
         }

         if (this.options.showRefresh) {
             html.push(sprintf('<button class="btn' +
                     sprintf(' btn-%s', this.options.buttonsClass) +
                     sprintf(' btn-%s', this.options.iconSize) +
                     '" type="button" name="refresh" aria-label="refresh" title="%s">',
                     this.options.formatRefresh()),
                 sprintf('<i class="%s %s"></i>', this.options.iconsPrefix, this.options.icons.refresh),
                 sprintf('<span class="text">%s</span>', this.options.formatRefresh()),
                 '</button>');
         }

         if (this.options.showToggle) {
             html.push(sprintf('<button class="btn' +
                     sprintf(' btn-%s', this.options.buttonsClass) +
                     sprintf(' btn-%s', this.options.iconSize) +
                     '" type="button" name="toggle" aria-label="toggle" title="%s">',
                     this.options.formatToggle()),
                 sprintf('<i class="%s %s"></i>', this.options.iconsPrefix, this.options.icons.toggle),
                 sprintf('<span class="text">%s</span>', this.options.formatToggle()),
                 '</button>');
         }

         if (this.options.showColumns) {
             html.push(sprintf('<div class="keep-open btn-group" name="columns" title="%s">',
                     this.options.formatColumns()),
                 '<button type="button" aria-label="columns" class="btn' +
                 sprintf(' btn-%s', this.options.buttonsClass) +
                 sprintf(' btn-%s', this.options.iconSize) +
                 ' dropdown-toggle" data-toggle="dropdown">',
                 sprintf('<i class="%s %s"></i>', this.options.iconsPrefix, this.options.icons.columns),
                sprintf('<span class="text">%s</span>', this.options.formatColumns()),
                 ' <span class="caret"></span>',
                 '</button>',
                 '<ul class="dropdown-menu" role="menu">');

             $.each(this.columns, function (i, column) {
                 if (column.radio || column.checkbox) {
                     return;
                 }

                 if (that.options.cardView && !column.cardVisible) {
                     return;
                 }

                 var checked = column.visible ? ' checked="checked"' : '';

                 if (column.switchable) {
                     html.push(sprintf('<li role="menuitem">' +
                         '<label><input type="checkbox" data-field="%s" value="%s"%s> %s</label>' +
                         '</li>', column.field, i, checked, column.title));
                     switchableCount++;
                 }
             });
             html.push('</ul>',
                 '</div>');
         }

         html.push('</div>');

         // Fix #188: this.showToolbar is for extensions
         if (this.showToolbar || html.length > 2) {
             this.$toolbar.append(html.join(''));
         }

         if (this.options.showPaginationSwitch) {
             this.$toolbar.find('button[name="paginationSwitch"]')
                 .off('click').on('click', $.proxy(this.togglePagination, this));
         }

         if (this.options.showRefresh) {
             this.$toolbar.find('button[name="refresh"]')
                 .off('click').on('click', $.proxy(this.refresh, this));
         }

         if (this.options.showToggle) {
             this.$toolbar.find('button[name="toggle"]')
                 .off('click').on('click', function () {
                     that.toggleView();
                 });
         }

         if (this.options.showColumns) {
             $keepOpen = this.$toolbar.find('.keep-open');

             if (switchableCount <= this.options.minimumCountColumns) {
                 $keepOpen.find('input').prop('disabled', true);
             }

             $keepOpen.find('li').off('click').on('click', function (event) {
                 event.stopImmediatePropagation();
             });
             $keepOpen.find('input').off('click').on('click', function () {
                 var $this = $(this);

                 that.toggleColumn($(this).val(), $this.prop('checked'), false);
                 that.trigger('column-switch', $(this).data('field'), $this.prop('checked'));
             });
         }

         if (this.options.search) {
             html = [];
             html.push(
                 '<div class="pull-' + this.options.searchAlign + ' search">',
                 sprintf('<input class="form-control' +
                     sprintf(' input-%s', this.options.iconSize) +
                     '" type="text" placeholder="%s">',
                     this.options.formatSearch()),
                 '</div>');

             this.$toolbar.append(html.join(''));
             $search = this.$toolbar.find('.search input');
             $search.off('keyup drop blur').on('keyup drop blur', function (event) {
                 if (that.options.searchOnEnterKey && event.keyCode !== 13) {
                     return;
                 }

                 if ($.inArray(event.keyCode, [37, 38, 39, 40]) > -1) {
                     return;
                 }

                 clearTimeout(timeoutId); // doesn't matter if it's 0
                 timeoutId = setTimeout(function () {
                     that.onSearch(event);
                 }, that.options.searchTimeOut);
             });

             if (isIEBrowser()) {
                 $search.off('mouseup').on('mouseup', function (event) {
                     clearTimeout(timeoutId); // doesn't matter if it's 0
                     timeoutId = setTimeout(function () {
                         that.onSearch(event);
                     }, that.options.searchTimeOut);
                 });
             }
         }
     };

     BootstrapTable.prototype.onSearch = function (event) {
         var text = $.trim($(event.currentTarget).val());

         // trim search input
         if (this.options.trimOnSearch && $(event.currentTarget).val() !== text) {
             $(event.currentTarget).val(text);
         }

         if (text === this.searchText) {
             return;
         }
         this.searchText = text;
         this.options.searchText = text;

         this.options.pageNumber = 1;
         this.initSearch();
         this.updatePagination();
         this.trigger('search', text);
     };

     BootstrapTable.prototype.initSearch = function () {
         var that = this;

         if (this.options.sidePagination !== 'server') {
             if (this.options.customSearch !== $.noop) {
                 this.options.customSearch.apply(this, [this.searchText]);
                 return;
             }

             var s = this.searchText && (this.options.escape ?
                 escapeHTML(this.searchText) : this.searchText).toLowerCase();
             var f = $.isEmptyObject(this.filterColumns) ? null : this.filterColumns;

             // Check filter
             this.data = f ? $.grep(this.options.data, function (item, i) {
                 for (var key in f) {
                     if ($.isArray(f[key]) && $.inArray(item[key], f[key]) === -1 ||
                             !$.isArray(f[key]) && item[key] !== f[key]) {
                         return false;
                     }
                 }
                 return true;
             }) : this.options.data;

             this.data = s ? $.grep(this.data, function (item, i) {
                 for (var j = 0; j < that.header.fields.length; j++) {

                     if (!that.header.searchables[j]) {
                         continue;
                     }

                     var key = $.isNumeric(that.header.fields[j]) ? parseInt(that.header.fields[j], 10) : that.header.fields[j];
                     var column = that.columns[getFieldIndex(that.columns, key)];
                     var value;

                     if (typeof key === 'string') {
                         value = item;
                         var props = key.split('.');
                         for (var prop_index = 0; prop_index < props.length; prop_index++) {
                             value = value[props[prop_index]];
                         }

                         // Fix #142: respect searchForamtter boolean
                         if (column && column.searchFormatter) {
                             value = calculateObjectValue(column,
                                 that.header.formatters[j], [value, item, i], value);
                         }
                     } else {
                         value = item[key];
                     }

                     if (typeof value === 'string' || typeof value === 'number') {
                         if (that.options.strictSearch) {
                             if ((value + '').toLowerCase() === s) {
                                 return true;
                             }
                         } else {
                             if ((value + '').toLowerCase().indexOf(s) !== -1) {
                                 return true;
                             }
                         }
                     }
                 }
                 return false;
             }) : this.data;
         }
     };

     BootstrapTable.prototype.initPagination = function () {
         if (!this.options.pagination) {
             this.$pagination.hide();
             return;
         } else {
             this.$pagination.show();
         }

         var that = this,
             html = [],
             $allSelected = false,
             i, from, to,
             $pageList,
             $first, $pre,
             $next, $last,
             $number,
             data = this.getData(),
             pageList = this.options.pageList;

         if (this.options.sidePagination !== 'server') {
             this.options.totalRows = data.length;
         }

         this.totalPages = 0;
         if (this.options.totalRows) {
             if (this.options.pageSize === this.options.formatAllRows()) {
                 this.options.pageSize = this.options.totalRows;
                 $allSelected = true;
             } else if (this.options.pageSize === this.options.totalRows) {
                 // Fix #667 Table with pagination,
                 // multiple pages and a search that matches to one page throws exception
                 var pageLst = typeof this.options.pageList === 'string' ?
                     this.options.pageList.replace('[', '').replace(']', '')
                         .replace(/ /g, '').toLowerCase().split(',') : this.options.pageList;
                 if ($.inArray(this.options.formatAllRows().toLowerCase(), pageLst)  > -1) {
                     $allSelected = true;
                 }
             }

             this.totalPages = ~~((this.options.totalRows - 1) / this.options.pageSize) + 1;

             this.options.totalPages = this.totalPages;
         }
         if (this.totalPages > 0 && this.options.pageNumber > this.totalPages) {
             this.options.pageNumber = this.totalPages;
         }

         this.pageFrom = (this.options.pageNumber - 1) * this.options.pageSize + 1;
         this.pageTo = this.options.pageNumber * this.options.pageSize;
         if (this.pageTo > this.options.totalRows) {
             this.pageTo = this.options.totalRows;
         }

         html.push(
             '<div class="pull-' + this.options.paginationDetailHAlign + ' pagination-detail">',
             '<span class="pagination-info">',
             this.options.onlyInfoPagination ? this.options.formatDetailPagination(this.options.totalRows) :
             this.options.formatShowingRows(this.pageFrom, this.pageTo, this.options.totalRows),
             '</span>');

         if (!this.options.onlyInfoPagination) {
             html.push('<span class="page-list">');

             var pageNumber = [
                     sprintf('<span class="btn-group %s">',
                         this.options.paginationVAlign === 'top' || this.options.paginationVAlign === 'both' ?
                             'dropdown' : 'dropup'),
                     '<button type="button" class="btn' +
                     sprintf(' btn-%s', this.options.buttonsClass) +
                     sprintf(' btn-%s', this.options.iconSize) +
                     ' dropdown-toggle" data-toggle="dropdown">',
                     '<span class="page-size">',
                     $allSelected ? this.options.formatAllRows() : this.options.pageSize,
                     '</span>',
                     ' <span class="caret"></span>',
                     '</button>',
                     '<ul class="dropdown-menu" role="menu">'
                 ];

             if (typeof this.options.pageList === 'string') {
                 var list = this.options.pageList.replace('[', '').replace(']', '')
                     .replace(/ /g, '').split(',');

                 pageList = [];
                 $.each(list, function (i, value) {
                     pageList.push(value.toUpperCase() === that.options.formatAllRows().toUpperCase() ?
                         that.options.formatAllRows() : +value);
                 });
             }

             $.each(pageList, function (i, page) {
                 if (!that.options.smartDisplay || i === 0 || pageList[i - 1] < that.options.totalRows) {
                     var active;
                     if ($allSelected) {
                         active = page === that.options.formatAllRows() ? ' class="active"' : '';
                     } else {
                         active = page === that.options.pageSize ? ' class="active"' : '';
                     }
                     pageNumber.push(sprintf('<li role="menuitem"%s><a href="#">%s</a></li>', active, page));
                 }
             });
             pageNumber.push('</ul></span>');

             html.push(this.options.formatRecordsPerPage(pageNumber.join('')));
             html.push('</span>');

             html.push('</div>',
                 '<div class="pull-' + this.options.paginationHAlign + ' pagination">',
                 '<ul class="pagination' + sprintf(' pagination-%s', this.options.iconSize) + '">',
                 '<li class="page-pre"><a href="#">' + this.options.paginationPreText + '</a></li>');

             if (this.totalPages < 5) {
                 from = 1;
                 to = this.totalPages;
             } else {
                 from = this.options.pageNumber - 2;
                 to = from + 4;
                 if (from < 1) {
                     from = 1;
                     to = 5;
                 }
                 if (to > this.totalPages) {
                     to = this.totalPages;
                     from = to - 4;
                 }
             }

             if (this.totalPages >= 6) {
                 if (this.options.pageNumber >= 3) {
                     html.push('<li class="page-first' + (1 === this.options.pageNumber ? ' active' : '') + '">',
                         '<a href="#">', 1, '</a>',
                         '</li>');

                     from++;
                 }

                 if (this.options.pageNumber >= 4) {
                     if (this.options.pageNumber == 4 || this.totalPages == 6 || this.totalPages == 7) {
                         from--;
                     } else {
                         html.push('<li class="page-first-separator disabled">',
                             '<a href="#">...</a>',
                             '</li>');
                     }

                     to--;
                 }
             }

             if (this.totalPages >= 7) {
                 if (this.options.pageNumber >= (this.totalPages - 2)) {
                     from--;
                 }
             }

             if (this.totalPages == 6) {
                 if (this.options.pageNumber >= (this.totalPages - 2)) {
                     to++;
                 }
             } else if (this.totalPages >= 7) {
                 if (this.totalPages == 7 || this.options.pageNumber >= (this.totalPages - 3)) {
                     to++;
                 }
             }

             for (i = from; i <= to; i++) {
                 html.push('<li class="page-number' + (i === this.options.pageNumber ? ' active' : '') + '">',
                     '<a href="#">', i, '</a>',
                     '</li>');
             }

             if (this.totalPages >= 8) {
                 if (this.options.pageNumber <= (this.totalPages - 4)) {
                     html.push('<li class="page-last-separator disabled">',
                         '<a href="#">...</a>',
                         '</li>');
                 }
             }

             if (this.totalPages >= 6) {
                 if (this.options.pageNumber <= (this.totalPages - 3)) {
                     html.push('<li class="page-last' + (this.totalPages === this.options.pageNumber ? ' active' : '') + '">',
                         '<a href="#">', this.totalPages, '</a>',
                         '</li>');
                 }
             }

             html.push(
                 '<li class="page-next"><a href="#">' + this.options.paginationNextText + '</a></li>',
                 '</ul>',
                 '</div>');
         }
         this.$pagination.html(html.join(''));

         if (!this.options.onlyInfoPagination) {
             $pageList = this.$pagination.find('.page-list a');
             $first = this.$pagination.find('.page-first');
             $pre = this.$pagination.find('.page-pre');
             $next = this.$pagination.find('.page-next');
             $last = this.$pagination.find('.page-last');
             $number = this.$pagination.find('.page-number');

             if (this.options.smartDisplay) {
                 if (this.totalPages <= 1) {
                     this.$pagination.find('div.pagination').hide();
                 }
                 if (pageList.length < 2 || this.options.totalRows <= pageList[0]) {
                     this.$pagination.find('span.page-list').hide();
                 }

                 // when data is empty, hide the pagination
                 this.$pagination[this.getData().length ? 'show' : 'hide']();
             }

             if (!this.options.paginationLoop) {
                 if (this.options.pageNumber === 1) {
                     $pre.addClass('disabled');
                 }
                 if (this.options.pageNumber === this.totalPages) {
                     $next.addClass('disabled');
                 }
             }

             if ($allSelected) {
                 this.options.pageSize = this.options.formatAllRows();
             }
             $pageList.off('click').on('click', $.proxy(this.onPageListChange, this));
             $first.off('click').on('click', $.proxy(this.onPageFirst, this));
             $pre.off('click').on('click', $.proxy(this.onPagePre, this));
             $next.off('click').on('click', $.proxy(this.onPageNext, this));
             $last.off('click').on('click', $.proxy(this.onPageLast, this));
             $number.off('click').on('click', $.proxy(this.onPageNumber, this));
         }
     };

     BootstrapTable.prototype.updatePagination = function (event) {
         // Fix #171: IE disabled button can be clicked bug.
         if (event && $(event.currentTarget).hasClass('disabled')) {
             return;
         }

         if (!this.options.maintainSelected) {
             this.resetRows();
         }

         this.initPagination();
         if (this.options.sidePagination === 'server') {
             this.initServer();
         } else {
             this.initBody();
         }

         this.trigger('page-change', this.options.pageNumber, this.options.pageSize);
     };

     BootstrapTable.prototype.onPageListChange = function (event) {
         var $this = $(event.currentTarget);

         $this.parent().addClass('active').siblings().removeClass('active');
         this.options.pageSize = $this.text().toUpperCase() === this.options.formatAllRows().toUpperCase() ?
             this.options.formatAllRows() : +$this.text();
         this.$toolbar.find('.page-size').text(this.options.pageSize);

         this.updatePagination(event);
         return false;
     };

     BootstrapTable.prototype.onPageFirst = function (event) {
         this.options.pageNumber = 1;
         this.updatePagination(event);
         return false;
     };

     BootstrapTable.prototype.onPagePre = function (event) {
         if ((this.options.pageNumber - 1) === 0) {
             this.options.pageNumber = this.options.totalPages;
         } else {
             this.options.pageNumber--;
         }
         this.updatePagination(event);
         return false;
     };

     BootstrapTable.prototype.onPageNext = function (event) {
         if ((this.options.pageNumber + 1) > this.options.totalPages) {
             this.options.pageNumber = 1;
         } else {
             this.options.pageNumber++;
         }
         this.updatePagination(event);
         return false;
     };

     BootstrapTable.prototype.onPageLast = function (event) {
         this.options.pageNumber = this.totalPages;
         this.updatePagination(event);
         return false;
     };

     BootstrapTable.prototype.onPageNumber = function (event) {
         if (this.options.pageNumber === +$(event.currentTarget).text()) {
             return;
         }
         this.options.pageNumber = +$(event.currentTarget).text();
         this.updatePagination(event);
         return false;
     };

     BootstrapTable.prototype.initRow = function(item, i, data, parentDom) {
         var that=this,
             key,
             html = [],
             style = {},
             csses = [],
             data_ = '',
             attributes = {},
             htmlAttributes = [];

         if ($.inArray(item, this.hiddenRows) > -1) {
             return;
         }

         style = calculateObjectValue(this.options, this.options.rowStyle, [item, i], style);

         if (style && style.css) {
             for (key in style.css) {
                 csses.push(key + ': ' + style.css[key]);
             }
         }

         attributes = calculateObjectValue(this.options,
             this.options.rowAttributes, [item, i], attributes);

         if (attributes) {
             for (key in attributes) {
                 htmlAttributes.push(sprintf('%s="%s"', key, escapeHTML(attributes[key])));
             }
         }

         if (item._data && !$.isEmptyObject(item._data)) {
             $.each(item._data, function(k, v) {
                 // ignore data-index
                 if (k === 'index') {
                     return;
                 }
                 data_ += sprintf(' data-%s="%s"', k, v);
             });
         }

         html.push('<tr',
             sprintf(' %s', htmlAttributes.join(' ')),
             sprintf(' id="%s"', $.isArray(item) ? undefined : item._id),
             sprintf(' class="%s"', style.classes || ($.isArray(item) ? undefined : item._class)),
             sprintf(' data-index="%s"', i),
             sprintf(' data-uniqueid="%s"', item[this.options.uniqueId]),
             sprintf('%s', data_),
             '>'
         );

         if (this.options.cardView) {
             html.push(sprintf('<td colspan="%s"><div class="card-views">', this.header.fields.length));
         }

         if (!this.options.cardView && this.options.detailView) {
             html.push('<td>',
                 '<a class="detail-icon" href="#">',
                 sprintf('<i class="%s %s"></i>', this.options.iconsPrefix, this.options.icons.detailOpen),
                 '</a>',
                 '</td>');
         }

         $.each(this.header.fields, function(j, field) {
             var text = '',
                 value_ = getItemField(item, field, that.options.escape),
                 value = '',
                 type = '',
                 cellStyle = {},
                 id_ = '',
                 class_ = that.header.classes[j],
                 data_ = '',
                 rowspan_ = '',
                 colspan_ = '',
                 title_ = '',
                 column = that.columns[j];

             if (that.fromHtml && typeof value_ === 'undefined') {
                 return;
             }

             if (!column.visible) {
                 return;
             }

             if (that.options.cardView && (!column.cardVisible)) {
                 return;
             }

             if (column.escape) {
                 value_ = escapeHTML(value_);
             }

             style = sprintf('style="%s"', csses.concat(that.header.styles[j]).join('; '));

             // handle td's id and class
             if (item['_' + field + '_id']) {
                 id_ = sprintf(' id="%s"', item['_' + field + '_id']);
             }
             if (item['_' + field + '_class']) {
                 class_ = sprintf(' class="%s"', item['_' + field + '_class']);
             }
             if (item['_' + field + '_rowspan']) {
                 rowspan_ = sprintf(' rowspan="%s"', item['_' + field + '_rowspan']);
             }
             if (item['_' + field + '_colspan']) {
                 colspan_ = sprintf(' colspan="%s"', item['_' + field + '_colspan']);
             }
             if (item['_' + field + '_title']) {
                 title_ = sprintf(' title="%s"', item['_' + field + '_title']);
             }
             cellStyle = calculateObjectValue(that.header,
                 that.header.cellStyles[j], [value_, item, i, field], cellStyle);
             if (cellStyle.classes) {
                 class_ = sprintf(' class="%s"', cellStyle.classes);
             }
             if (cellStyle.css) {
                 var csses_ = [];
                 for (var key in cellStyle.css) {
                     csses_.push(key + ': ' + cellStyle.css[key]);
                 }
                 style = sprintf('style="%s"', csses_.concat(that.header.styles[j]).join('; '));
             }

             value = calculateObjectValue(column,
                 that.header.formatters[j], [value_, item, i], value_);

             if (item['_' + field + '_data'] && !$.isEmptyObject(item['_' + field + '_data'])) {
                 $.each(item['_' + field + '_data'], function(k, v) {
                     // ignore data-index
                     if (k === 'index') {
                         return;
                     }
                     data_ += sprintf(' data-%s="%s"', k, v);
                 });
             }

             if (column.checkbox || column.radio) {
                 type = column.checkbox ? 'checkbox' : type;
                 type = column.radio ? 'radio' : type;

                 text = [sprintf(that.options.cardView ?
                         '<div class="card-view %s">' : '<td class="bs-checkbox %s">', column['class'] || ''),
                     '<input' +
                     sprintf(' data-index="%s"', i) +
                     sprintf(' name="%s"', that.options.selectItemName) +
                     sprintf(' type="%s"', type) +
                     sprintf(' value="%s"', item[that.options.idField]) +
                     sprintf(' checked="%s"', value === true ||
                         (value_ || value && value.checked) ? 'checked' : undefined) +
                     sprintf(' disabled="%s"', !column.checkboxEnabled ||
                         (value && value.disabled) ? 'disabled' : undefined) +
                     ' />',
                     that.header.formatters[j] && typeof value === 'string' ? value : '',
                     that.options.cardView ? '</div>' : '</td>'
                 ].join('');

                 item[that.header.stateField] = value === true || (value && value.checked);
             } else {
                 value = typeof value === 'undefined' || value === null ?
                     that.options.undefinedText : value;

                 text = that.options.cardView ? ['<div class="card-view">',
                     that.options.showHeader ? sprintf('<span class="title" %s>%s</span>', style,
                         getPropertyFromOther(that.columns, 'field', 'title', field)) : '',
                     sprintf('<span class="value">%s</span>', value),
                     '</div>'
                 ].join('') : [sprintf('<td%s %s %s %s %s %s %s>',
                         id_, class_, style, data_, rowspan_, colspan_, title_),
                     value,
                     '</td>'
                 ].join('');

                 // Hide empty data on Card view when smartDisplay is set to true.
                 if (that.options.cardView && that.options.smartDisplay && value === '') {
                     // Should set a placeholder for event binding correct fieldIndex
                     text = '<div class="card-view"></div>';
                 }
             }

             html.push(text);
         });

         if (this.options.cardView) {
             html.push('</div></td>');
         }
         html.push('</tr>');

         return html.join(' ');
     };

     BootstrapTable.prototype.initBody = function (fixedScroll) {
         var that = this,
             html = [],
             data = this.getData();

         this.trigger('pre-body', data);

         this.$body = this.$el.find('>tbody');
         if (!this.$body.length) {
             this.$body = $('<tbody></tbody>').appendTo(this.$el);
         }

         //Fix #389 Bootstrap-table-flatJSON is not working

         if (!this.options.pagination || this.options.sidePagination === 'server') {
             this.pageFrom = 1;
             this.pageTo = data.length;
         }

         var trFragments = $(document.createDocumentFragment());
         var hasTr;

         for (var i = this.pageFrom - 1; i < this.pageTo; i++) {
             var item = data[i];
             var tr = this.initRow(item, i, data, trFragments);
             hasTr = hasTr || !!tr;
             if (tr&&tr!==true) {
                 trFragments.append(tr);
             }
         }

         // show no records
         if (!hasTr) {
             trFragments.append('<tr class="no-records-found">' +
                 sprintf('<td colspan="%s">%s</td>',
                 this.$header.find('th').length,
                 this.options.formatNoMatches()) +
                 '</tr>');
         }

         this.$body.html(trFragments);

         if (!fixedScroll) {
             this.scrollTo(0);
         }

         // click to select by column
         this.$body.find('> tr[data-index] > td').off('click dblclick').on('click dblclick', function (e) {
             var $td = $(this),
                 $tr = $td.parent(),
                 item = that.data[$tr.data('index')],
                 index = $td[0].cellIndex,
                 fields = that.getVisibleFields(),
                 field = fields[that.options.detailView && !that.options.cardView ? index - 1 : index],
                 column = that.columns[getFieldIndex(that.columns, field)],
                 value = getItemField(item, field, that.options.escape);

             if ($td.find('.detail-icon').length) {
                 return;
             }

             that.trigger(e.type === 'click' ? 'click-cell' : 'dbl-click-cell', field, value, item, $td);
             that.trigger(e.type === 'click' ? 'click-row' : 'dbl-click-row', item, $tr, field);

             // if click to select - then trigger the checkbox/radio click
             if (e.type === 'click' && that.options.clickToSelect && column.clickToSelect) {
                 var $selectItem = $tr.find(sprintf('[name="%s"]', that.options.selectItemName));
                 if ($selectItem.length) {
                     $selectItem[0].click(); // #144: .trigger('click') bug
                 }
             }
         });

         this.$body.find('> tr[data-index] > td > .detail-icon').off('click').on('click', function () {
             var $this = $(this),
                 $tr = $this.parent().parent(),
                 index = $tr.data('index'),
                 row = data[index]; // Fix #980 Detail view, when searching, returns wrong row

             // remove and update
             if ($tr.next().is('tr.detail-view')) {
                 $this.find('i').attr('class', sprintf('%s %s', that.options.iconsPrefix, that.options.icons.detailOpen));
                 that.trigger('collapse-row', index, row);
                 $tr.next().remove();
             } else {
                 $this.find('i').attr('class', sprintf('%s %s', that.options.iconsPrefix, that.options.icons.detailClose));
                 $tr.after(sprintf('<tr class="detail-view"><td colspan="%s"></td></tr>', $tr.find('td').length));
                 var $element = $tr.next().find('td');
                 var content = calculateObjectValue(that.options, that.options.detailFormatter, [index, row, $element], '');
                 if($element.length === 1) {
                     $element.append(content);
                 }
                 that.trigger('expand-row', index, row, $element);
             }
             that.resetView();
             return false;
         });

         this.$selectItem = this.$body.find(sprintf('[name="%s"]', this.options.selectItemName));
         this.$selectItem.off('click').on('click', function (event) {
             event.stopImmediatePropagation();

             var $this = $(this),
                 checked = $this.prop('checked'),
                 row = that.data[$this.data('index')];

             if (that.options.maintainSelected && $(this).is(':radio')) {
                 $.each(that.options.data, function (i, row) {
                     row[that.header.stateField] = false;
                 });
             }

             row[that.header.stateField] = checked;

             if (that.options.singleSelect) {
                 that.$selectItem.not(this).each(function () {
                     that.data[$(this).data('index')][that.header.stateField] = false;
                 });
                 that.$selectItem.filter(':checked').not(this).prop('checked', false);
             }

             that.updateSelected();
             that.trigger(checked ? 'check' : 'uncheck', row, $this);
         });

         $.each(this.header.events, function (i, events) {
             if (!events) {
                 return;
             }
             // fix bug, if events is defined with namespace
             if (typeof events === 'string') {
                 events = calculateObjectValue(null, events);
             }

             var field = that.header.fields[i],
                 fieldIndex = $.inArray(field, that.getVisibleFields());

             if (that.options.detailView && !that.options.cardView) {
                 fieldIndex += 1;
             }

             for (var key in events) {
                 that.$body.find('>tr:not(.no-records-found)').each(function () {
                     var $tr = $(this),
                         $td = $tr.find(that.options.cardView ? '.card-view' : 'td').eq(fieldIndex),
                         index = key.indexOf(' '),
                         name = key.substring(0, index),
                         el = key.substring(index + 1),
                         func = events[key];

                     $td.find(el).off(name).on(name, function (e) {
                         var index = $tr.data('index'),
                             row = that.data[index],
                             value = row[field];

                         func.apply(this, [e, value, row, index]);
                     });
                 });
             }
         });

         this.updateSelected();
         this.resetView();

         this.trigger('post-body', data);
     };

     BootstrapTable.prototype.initServer = function (silent, query, url) {
         var that = this,
             data = {},
             params = {
                 searchText: this.searchText,
                 sortName: this.options.sortName,
                 sortOrder: this.options.sortOrder
             },
             request;

         if (this.options.pagination) {
             params.pageSize = this.options.pageSize === this.options.formatAllRows() ?
                 this.options.totalRows : this.options.pageSize;
             params.pageNumber = this.options.pageNumber;
         }

         if (!(url || this.options.url) && !this.options.ajax) {
             return;
         }

         if (this.options.queryParamsType === 'limit') {
             params = {
                 search: params.searchText,
                 sort: params.sortName,
                 order: params.sortOrder
             };

             if (this.options.pagination) {
                 params.offset = this.options.pageSize === this.options.formatAllRows() ?
                     0 : this.options.pageSize * (this.options.pageNumber - 1);
                 params.limit = this.options.pageSize === this.options.formatAllRows() ?
                     this.options.totalRows : this.options.pageSize;
             }
         }

         if (!($.isEmptyObject(this.filterColumnsPartial))) {
             params.filter = JSON.stringify(this.filterColumnsPartial, null);
         }

         data = calculateObjectValue(this.options, this.options.queryParams, [params], data);

         $.extend(data, query || {});

         // false to stop request
         if (data === false) {
             return;
         }

         if (!silent) {
             this.$tableLoading.show();
         }
         request = $.extend({}, calculateObjectValue(null, this.options.ajaxOptions), {
             type: this.options.method,
             url:  url || this.options.url,
             data: this.options.contentType === 'application/json' && this.options.method === 'post' ?
                 JSON.stringify(data) : data,
             cache: this.options.cache,
             contentType: this.options.contentType,
             dataType: this.options.dataType,
             success: function (res) {
                 res = calculateObjectValue(that.options, that.options.responseHandler, [res], res);

                 that.load(res);
                 that.trigger('load-success', res);
                 if (!silent) that.$tableLoading.hide();
             },
             error: function (res) {
                 that.trigger('load-error', res.status, res);
                 if (!silent) that.$tableLoading.hide();
             }
         });

         if (this.options.ajax) {
             calculateObjectValue(this, this.options.ajax, [request], null);
         } else {
             if (this._xhr && this._xhr.readyState !== 4) {
                 this._xhr.abort();
             }
             this._xhr = $.ajax(request);
         }
     };

     BootstrapTable.prototype.initSearchText = function () {
         if (this.options.search) {
             if (this.options.searchText !== '') {
                 var $search = this.$toolbar.find('.search input');
                 $search.val(this.options.searchText);
                 this.onSearch({currentTarget: $search});
             }
         }
     };

     BootstrapTable.prototype.getCaret = function () {
         var that = this;

         $.each(this.$header.find('th'), function (i, th) {
             $(th).find('.sortable').removeClass('desc asc').addClass($(th).data('field') === that.options.sortName ? that.options.sortOrder : 'both');
         });
     };

     BootstrapTable.prototype.updateSelected = function () {
         var checkAll = this.$selectItem.filter(':enabled').length &&
             this.$selectItem.filter(':enabled').length ===
             this.$selectItem.filter(':enabled').filter(':checked').length;

         this.$selectAll.add(this.$selectAll_).prop('checked', checkAll);

         this.$selectItem.each(function () {
             $(this).closest('tr')[$(this).prop('checked') ? 'addClass' : 'removeClass']('selected');
         });
     };

     BootstrapTable.prototype.updateRows = function () {
         var that = this;

         this.$selectItem.each(function () {
             that.data[$(this).data('index')][that.header.stateField] = $(this).prop('checked');
         });
     };

     BootstrapTable.prototype.resetRows = function () {
         var that = this;

         $.each(this.data, function (i, row) {
             that.$selectAll.prop('checked', false);
             that.$selectItem.prop('checked', false);
             if (that.header.stateField) {
                 row[that.header.stateField] = false;
             }
         });
         this.initHiddenRows();
     };

     BootstrapTable.prototype.trigger = function (name) {
         var args = Array.prototype.slice.call(arguments, 1);

         name += '.bs.table';
         this.options[BootstrapTable.EVENTS[name]].apply(this.options, args);
         this.$el.trigger($.Event(name), args);

         this.options.onAll(name, args);
         this.$el.trigger($.Event('all.bs.table'), [name, args]);
     };

     BootstrapTable.prototype.resetHeader = function () {
         // fix #61: the hidden table reset header bug.
         // fix bug: get $el.css('width') error sometime (height = 500)
         clearTimeout(this.timeoutId_);
         this.timeoutId_ = setTimeout($.proxy(this.fitHeader, this), this.$el.is(':hidden') ? 100 : 0);
     };

     BootstrapTable.prototype.fitHeader = function () {
         var that = this,
             fixedBody,
             scrollWidth,
             focused,
             focusedTemp;

         if (that.$el.is(':hidden')) {
             that.timeoutId_ = setTimeout($.proxy(that.fitHeader, that), 100);
             return;
         }
         fixedBody = this.$tableBody.get(0);

         scrollWidth = fixedBody.scrollWidth > fixedBody.clientWidth &&
         fixedBody.scrollHeight > fixedBody.clientHeight + this.$header.outerHeight() ?
             getScrollBarWidth() : 0;

         this.$el.css('margin-top', -this.$header.outerHeight());

         focused = $(':focus');
         if (focused.length > 0) {
             var $th = focused.parents('th');
             if ($th.length > 0) {
                 var dataField = $th.attr('data-field');
                 if (dataField !== undefined) {
                     var $headerTh = this.$header.find("[data-field='" + dataField + "']");
                     if ($headerTh.length > 0) {
                         $headerTh.find(":input").addClass("focus-temp");
                     }
                 }
             }
         }

         this.$header_ = this.$header.clone(true, true);
         this.$selectAll_ = this.$header_.find('[name="btSelectAll"]');
         this.$tableHeader.css({
             'margin-right': scrollWidth
         }).find('table').css('width', this.$el.outerWidth())
             .html('').attr('class', this.$el.attr('class'))
             .append(this.$header_);


         focusedTemp = $('.focus-temp:visible:eq(0)');
         if (focusedTemp.length > 0) {
             focusedTemp.focus();
             this.$header.find('.focus-temp').removeClass('focus-temp');
         }

         // fix bug: $.data() is not working as expected after $.append()
         this.$header.find('th[data-field]').each(function (i) {
             that.$header_.find(sprintf('th[data-field="%s"]', $(this).data('field'))).data($(this).data());
         });

         var visibleFields = this.getVisibleFields(),
             $ths = this.$header_.find('th');

         this.$body.find('>tr:first-child:not(.no-records-found) > *').each(function (i) {
             var $this = $(this),
                 index = i;

             if (that.options.detailView && !that.options.cardView) {
                 if (i === 0) {
                     that.$header_.find('th.detail').find('.fht-cell').width($this.innerWidth());
                 }
                 index = i - 1;
             }

             var $th = that.$header_.find(sprintf('th[data-field="%s"]', visibleFields[index]));
             if ($th.length > 1) {
                 $th = $($ths[$this[0].cellIndex]);
             }

             $th.find('.fht-cell').width($this.innerWidth());
         });
         // horizontal scroll event
         // TODO: it's probably better improving the layout than binding to scroll event
         this.$tableBody.off('scroll').on('scroll', function () {
             that.$tableHeader.scrollLeft($(this).scrollLeft());

             if (that.options.showFooter && !that.options.cardView) {
                 that.$tableFooter.scrollLeft($(this).scrollLeft());
             }
         });
         that.trigger('post-header');
     };

     BootstrapTable.prototype.resetFooter = function () {
         var that = this,
             data = that.getData(),
             html = [];

         if (!this.options.showFooter || this.options.cardView) { //do nothing
             return;
         }

         if (!this.options.cardView && this.options.detailView) {
             html.push('<td><div class="th-inner">&nbsp;</div><div class="fht-cell"></div></td>');
         }

         $.each(this.columns, function (i, column) {
             var key,
                 falign = '', // footer align style
                 valign = '',
                 csses = [],
                 style = {},
                 class_ = sprintf(' class="%s"', column['class']);

             if (!column.visible) {
                 return;
             }

             if (that.options.cardView && (!column.cardVisible)) {
                 return;
             }

             falign = sprintf('text-align: %s; ', column.falign ? column.falign : column.align);
             valign = sprintf('vertical-align: %s; ', column.valign);

             style = calculateObjectValue(null, that.options.footerStyle);

             if (style && style.css) {
                 for (key in style.css) {
                     csses.push(key + ': ' + style.css[key]);
                 }
             }

             html.push('<td', class_, sprintf(' style="%s"', falign + valign + csses.concat().join('; ')), '>');
             html.push('<div class="th-inner">');

             html.push(calculateObjectValue(column, column.footerFormatter, [data], '&nbsp;') || '&nbsp;');

             html.push('</div>');
             html.push('<div class="fht-cell"></div>');
             html.push('</div>');
             html.push('</td>');
         });

         this.$tableFooter.find('tr').html(html.join(''));
         this.$tableFooter.show();
         clearTimeout(this.timeoutFooter_);
         this.timeoutFooter_ = setTimeout($.proxy(this.fitFooter, this),
             this.$el.is(':hidden') ? 100 : 0);
     };

     BootstrapTable.prototype.fitFooter = function () {
         var that = this,
             $footerTd,
             elWidth,
             scrollWidth;

         clearTimeout(this.timeoutFooter_);
         if (this.$el.is(':hidden')) {
             this.timeoutFooter_ = setTimeout($.proxy(this.fitFooter, this), 100);
             return;
         }

         elWidth = this.$el.css('width');
         scrollWidth = elWidth > this.$tableBody.width() ? getScrollBarWidth() : 0;

         this.$tableFooter.css({
             'margin-right': scrollWidth
         }).find('table').css('width', elWidth)
             .attr('class', this.$el.attr('class'));

         $footerTd = this.$tableFooter.find('td');

         this.$body.find('>tr:first-child:not(.no-records-found) > *').each(function (i) {
             var $this = $(this);

             $footerTd.eq(i).find('.fht-cell').width($this.innerWidth());
         });
     };

     BootstrapTable.prototype.toggleColumn = function (index, checked, needUpdate) {
         if (index === -1) {
             return;
         }
         this.columns[index].visible = checked;
         this.initHeader();
         this.initSearch();
         this.initPagination();
         this.initBody();

         if (this.options.showColumns) {
             var $items = this.$toolbar.find('.keep-open input').prop('disabled', false);

             if (needUpdate) {
                 $items.filter(sprintf('[value="%s"]', index)).prop('checked', checked);
             }

             if ($items.filter(':checked').length <= this.options.minimumCountColumns) {
                 $items.filter(':checked').prop('disabled', true);
             }
         }
     };

     BootstrapTable.prototype.getVisibleFields = function () {
         var that = this,
             visibleFields = [];

         $.each(this.header.fields, function (j, field) {
             var column = that.columns[getFieldIndex(that.columns, field)];

             if (!column.visible) {
                 return;
             }
             visibleFields.push(field);
         });
         return visibleFields;
     };

     // PUBLIC FUNCTION DEFINITION
     // =======================

     BootstrapTable.prototype.resetView = function (params) {
         var padding = 0;

         if (params && params.height) {
             this.options.height = params.height;
         }

         this.$selectAll.prop('checked', this.$selectItem.length > 0 &&
             this.$selectItem.length === this.$selectItem.filter(':checked').length);

         if (this.options.height) {
             var toolbarHeight = this.$toolbar.outerHeight(true),
                 paginationHeight = this.$pagination.outerHeight(true),
                 height = this.options.height - toolbarHeight - paginationHeight;

             this.$tableContainer.css('height', height + 'px');
         }

         if (this.options.cardView) {
             // remove the element css
             this.$el.css('margin-top', '0');
             this.$tableContainer.css('padding-bottom', '0');
             this.$tableFooter.hide();
             return;
         }

         if (this.options.showHeader && this.options.height) {
             this.$tableHeader.show();
             this.resetHeader();
             padding += this.$header.outerHeight();
         } else {
             this.$tableHeader.hide();
             this.trigger('post-header');
         }

         if (this.options.showFooter) {
             this.resetFooter();
             if (this.options.height) {
                 padding += this.$tableFooter.outerHeight() + 1;
             }
         }

         // Assign the correct sortable arrow
         this.getCaret();
         this.$tableContainer.css('padding-bottom', padding + 'px');
         this.trigger('reset-view');
     };

     BootstrapTable.prototype.getData = function (useCurrentPage) {
         return (this.searchText || !$.isEmptyObject(this.filterColumns) || !$.isEmptyObject(this.filterColumnsPartial)) ?
             (useCurrentPage ? this.data.slice(this.pageFrom - 1, this.pageTo) : this.data) :
             (useCurrentPage ? this.options.data.slice(this.pageFrom - 1, this.pageTo) : this.options.data);
     };

     BootstrapTable.prototype.load = function (data) {
         var fixedScroll = false;

         // #431: support pagination
         if (this.options.sidePagination === 'server') {
             this.options.totalRows = data[this.options.totalField];
             fixedScroll = data.fixedScroll;
             data = data[this.options.dataField];
         } else if (!$.isArray(data)) { // support fixedScroll
             fixedScroll = data.fixedScroll;
             data = data.data;
         }

         this.initData(data);
         this.initSearch();
         this.initPagination();
         this.initBody(fixedScroll);
     };

     BootstrapTable.prototype.append = function (data) {
         this.initData(data, 'append');
         this.initSearch();
         this.initPagination();
         this.initSort();
         this.initBody(true);
     };

     BootstrapTable.prototype.prepend = function (data) {
         this.initData(data, 'prepend');
         this.initSearch();
         this.initPagination();
         this.initSort();
         this.initBody(true);
     };

     BootstrapTable.prototype.remove = function (params) {
         var len = this.options.data.length,
             i, row;

         if (!params.hasOwnProperty('field') || !params.hasOwnProperty('values')) {
             return;
         }

         for (i = len - 1; i >= 0; i--) {
             row = this.options.data[i];

             if (!row.hasOwnProperty(params.field)) {
                 continue;
             }
             if ($.inArray(row[params.field], params.values) !== -1) {
                 this.options.data.splice(i, 1);
                 if (this.options.sidePagination === 'server') {
                     this.options.totalRows -= 1;
                 }
             }
         }

         if (len === this.options.data.length) {
             return;
         }

         this.initSearch();
         this.initPagination();
         this.initSort();
         this.initBody(true);
     };

     BootstrapTable.prototype.removeAll = function () {
         if (this.options.data.length > 0) {
             this.options.data.splice(0, this.options.data.length);
             this.initSearch();
             this.initPagination();
             this.initBody(true);
         }
     };

     BootstrapTable.prototype.getRowByUniqueId = function (id) {
         var uniqueId = this.options.uniqueId,
             len = this.options.data.length,
             dataRow = null,
             i, row, rowUniqueId;

         for (i = len - 1; i >= 0; i--) {
             row = this.options.data[i];

             if (row.hasOwnProperty(uniqueId)) { // uniqueId is a column
                 rowUniqueId = row[uniqueId];
             } else if(row._data.hasOwnProperty(uniqueId)) { // uniqueId is a row data property
                 rowUniqueId = row._data[uniqueId];
             } else {
                 continue;
             }

             if (typeof rowUniqueId === 'string') {
                 id = id.toString();
             } else if (typeof rowUniqueId === 'number') {
                 if ((Number(rowUniqueId) === rowUniqueId) && (rowUniqueId % 1 === 0)) {
                     id = parseInt(id);
                 } else if ((rowUniqueId === Number(rowUniqueId)) && (rowUniqueId !== 0)) {
                     id = parseFloat(id);
                 }
             }

             if (rowUniqueId === id) {
                 dataRow = row;
                 break;
             }
         }

         return dataRow;
     };

     BootstrapTable.prototype.removeByUniqueId = function (id) {
         var len = this.options.data.length,
             row = this.getRowByUniqueId(id);

         if (row) {
             this.options.data.splice(this.options.data.indexOf(row), 1);
         }

         if (len === this.options.data.length) {
             return;
         }

         this.initSearch();
         this.initPagination();
         this.initBody(true);
     };

     BootstrapTable.prototype.updateByUniqueId = function (params) {
         var that = this;
         var allParams = $.isArray(params) ? params : [ params ];

         $.each(allParams, function(i, params) {
             var rowId;

             if (!params.hasOwnProperty('id') || !params.hasOwnProperty('row')) {
                 return;
             }

             rowId = $.inArray(that.getRowByUniqueId(params.id), that.options.data);

             if (rowId === -1) {
                 return;
             }
             $.extend(that.options.data[rowId], params.row);
         });

         this.initSearch();
         this.initPagination();
         this.initSort();
         this.initBody(true);
     };

     BootstrapTable.prototype.insertRow = function (params) {
         if (!params.hasOwnProperty('index') || !params.hasOwnProperty('row')) {
             return;
         }
         this.data.splice(params.index, 0, params.row);
         this.initSearch();
         this.initPagination();
         this.initSort();
         this.initBody(true);
     };

     BootstrapTable.prototype.updateRow = function (params) {
         var that = this;
         var allParams = $.isArray(params) ? params : [ params ];

         $.each(allParams, function(i, params) {
             if (!params.hasOwnProperty('index') || !params.hasOwnProperty('row')) {
                 return;
             }
             $.extend(that.options.data[params.index], params.row);
         });

         this.initSearch();
         this.initPagination();
         this.initSort();
         this.initBody(true);
     };

     BootstrapTable.prototype.initHiddenRows = function () {
         this.hiddenRows = [];
     };

     BootstrapTable.prototype.showRow = function (params) {
         this.toggleRow(params, true);
     };

     BootstrapTable.prototype.hideRow = function (params) {
         this.toggleRow(params, false);
     };

     BootstrapTable.prototype.toggleRow = function (params, visible) {
         var row, index;

         if (params.hasOwnProperty('index')) {
             row = this.getData()[params.index];
         } else if (params.hasOwnProperty('uniqueId')) {
             row = this.getRowByUniqueId(params.uniqueId);
         }

         if (!row) {
             return;
         }

         index = $.inArray(row, this.hiddenRows);

         if (!visible && index === -1) {
             this.hiddenRows.push(row);
         } else if (visible && index > -1) {
             this.hiddenRows.splice(index, 1);
         }
         this.initBody(true);
     };

     BootstrapTable.prototype.getHiddenRows = function (show) {
         var that = this,
             data = this.getData(),
             rows = [];

         $.each(data, function (i, row) {
             if ($.inArray(row, that.hiddenRows) > -1) {
                 rows.push(row);
             }
         });
         this.hiddenRows = rows;
         return rows;
     };

     BootstrapTable.prototype.mergeCells = function (options) {
         var row = options.index,
             col = $.inArray(options.field, this.getVisibleFields()),
             rowspan = options.rowspan || 1,
             colspan = options.colspan || 1,
             i, j,
             $tr = this.$body.find('>tr'),
             $td;

         if (this.options.detailView && !this.options.cardView) {
             col += 1;
         }

         $td = $tr.eq(row).find('>td').eq(col);

         if (row < 0 || col < 0 || row >= this.data.length) {
             return;
         }

         for (i = row; i < row + rowspan; i++) {
             for (j = col; j < col + colspan; j++) {
                 $tr.eq(i).find('>td').eq(j).hide();
             }
         }

         $td.attr('rowspan', rowspan).attr('colspan', colspan).show();
     };

     BootstrapTable.prototype.updateCell = function (params) {
         if (!params.hasOwnProperty('index') ||
             !params.hasOwnProperty('field') ||
             !params.hasOwnProperty('value')) {
             return;
         }
         this.data[params.index][params.field] = params.value;

         if (params.reinit === false) {
             return;
         }
         this.initSort();
         this.initBody(true);
     };

     BootstrapTable.prototype.getOptions = function () {
         return this.options;
     };

     BootstrapTable.prototype.getSelections = function () {
         var that = this;

         return $.grep(this.options.data, function (row) {
             // fix #2424: from html with checkbox
             return row[that.header.stateField] === true;
         });
     };

     BootstrapTable.prototype.getAllSelections = function () {
         var that = this;

         return $.grep(this.options.data, function (row) {
             return row[that.header.stateField];
         });
     };

     BootstrapTable.prototype.checkAll = function () {
         this.checkAll_(true);
     };

     BootstrapTable.prototype.uncheckAll = function () {
         this.checkAll_(false);
     };

     BootstrapTable.prototype.checkInvert = function () {
         var that = this;
         var rows = that.$selectItem.filter(':enabled');
         var checked = rows.filter(':checked');
         rows.each(function() {
             $(this).prop('checked', !$(this).prop('checked'));
         });
         that.updateRows();
         that.updateSelected();
         that.trigger('uncheck-some', checked);
         checked = that.getSelections();
         that.trigger('check-some', checked);
     };

     BootstrapTable.prototype.checkAll_ = function (checked) {
         var rows;
         if (!checked) {
             rows = this.getSelections();
         }
         this.$selectAll.add(this.$selectAll_).prop('checked', checked);
         this.$selectItem.filter(':enabled').prop('checked', checked);
         this.updateRows();
         if (checked) {
             rows = this.getSelections();
         }
         this.trigger(checked ? 'check-all' : 'uncheck-all', rows);
     };

     BootstrapTable.prototype.check = function (index) {
         this.check_(true, index);
     };

     BootstrapTable.prototype.uncheck = function (index) {
         this.check_(false, index);
     };

     BootstrapTable.prototype.check_ = function (checked, index) {
         var $el = this.$selectItem.filter(sprintf('[data-index="%s"]', index)).prop('checked', checked);
         this.data[index][this.header.stateField] = checked;
         this.updateSelected();
         this.trigger(checked ? 'check' : 'uncheck', this.data[index], $el);
     };

     BootstrapTable.prototype.checkBy = function (obj) {
         this.checkBy_(true, obj);
     };

     BootstrapTable.prototype.uncheckBy = function (obj) {
         this.checkBy_(false, obj);
     };

     BootstrapTable.prototype.checkBy_ = function (checked, obj) {
         if (!obj.hasOwnProperty('field') || !obj.hasOwnProperty('values')) {
             return;
         }

         var that = this,
             rows = [];
         $.each(this.options.data, function (index, row) {
             if (!row.hasOwnProperty(obj.field)) {
                 return false;
             }
             if ($.inArray(row[obj.field], obj.values) !== -1) {
                 var $el = that.$selectItem.filter(':enabled')
                     .filter(sprintf('[data-index="%s"]', index)).prop('checked', checked);
                 row[that.header.stateField] = checked;
                 rows.push(row);
                 that.trigger(checked ? 'check' : 'uncheck', row, $el);
             }
         });
         this.updateSelected();
         this.trigger(checked ? 'check-some' : 'uncheck-some', rows);
     };

     BootstrapTable.prototype.destroy = function () {
         this.$el.insertBefore(this.$container);
         $(this.options.toolbar).insertBefore(this.$el);
         this.$container.next().remove();
         this.$container.remove();
         this.$el.html(this.$el_.html())
             .css('margin-top', '0')
             .attr('class', this.$el_.attr('class') || ''); // reset the class
     };

     BootstrapTable.prototype.showLoading = function () {
         this.$tableLoading.show();
     };

     BootstrapTable.prototype.hideLoading = function () {
         this.$tableLoading.hide();
     };

     BootstrapTable.prototype.togglePagination = function () {
         this.options.pagination = !this.options.pagination;
         var button = this.$toolbar.find('button[name="paginationSwitch"] i');
         if (this.options.pagination) {
             button.attr("class", this.options.iconsPrefix + " " + this.options.icons.paginationSwitchDown);
         } else {
             button.attr("class", this.options.iconsPrefix + " " + this.options.icons.paginationSwitchUp);
         }
         this.updatePagination();
     };

     BootstrapTable.prototype.refresh = function (params) {
         if (params && params.url) {
             this.options.url = params.url;
         }
         if (params && params.pageNumber) {
             this.options.pageNumber = params.pageNumber;
         }
         if (params && params.pageSize) {
             this.options.pageSize = params.pageSize;
         }
         this.initServer(params && params.silent,
             params && params.query, params && params.url);
         this.trigger('refresh', params);
     };

     BootstrapTable.prototype.resetWidth = function () {
         if (this.options.showHeader && this.options.height) {
             this.fitHeader();
         }
         if (this.options.showFooter) {
             this.fitFooter();
         }
     };

     BootstrapTable.prototype.showColumn = function (field) {
         this.toggleColumn(getFieldIndex(this.columns, field), true, true);
     };

     BootstrapTable.prototype.hideColumn = function (field) {
         this.toggleColumn(getFieldIndex(this.columns, field), false, true);
     };

     BootstrapTable.prototype.getHiddenColumns = function () {
         return $.grep(this.columns, function (column) {
             return !column.visible;
         });
     };

     BootstrapTable.prototype.getVisibleColumns = function () {
         return $.grep(this.columns, function (column) {
             return column.visible;
         });
     };

     BootstrapTable.prototype.toggleAllColumns = function (visible) {
         $.each(this.columns, function (i, column) {
             this.columns[i].visible = visible;
         });

         this.initHeader();
         this.initSearch();
         this.initPagination();
         this.initBody();
         if (this.options.showColumns) {
             var $items = this.$toolbar.find('.keep-open input').prop('disabled', false);

             if ($items.filter(':checked').length <= this.options.minimumCountColumns) {
                 $items.filter(':checked').prop('disabled', true);
             }
         }
     };

     BootstrapTable.prototype.showAllColumns = function () {
         this.toggleAllColumns(true);
     };

     BootstrapTable.prototype.hideAllColumns = function () {
         this.toggleAllColumns(false);
     };

     BootstrapTable.prototype.filterBy = function (columns) {
         this.filterColumns = $.isEmptyObject(columns) ? {} : columns;
         this.options.pageNumber = 1;
         this.initSearch();
         this.updatePagination();
     };

     BootstrapTable.prototype.scrollTo = function (value) {
         if (typeof value === 'string') {
             value = value === 'bottom' ? this.$tableBody[0].scrollHeight : 0;
         }
         if (typeof value === 'number') {
             this.$tableBody.scrollTop(value);
         }
         if (typeof value === 'undefined') {
             return this.$tableBody.scrollTop();
         }
     };

     BootstrapTable.prototype.getScrollPosition = function () {
         return this.scrollTo();
     };

     BootstrapTable.prototype.selectPage = function (page) {
         if (page > 0 && page <= this.options.totalPages) {
             this.options.pageNumber = page;
             this.updatePagination();
         }
     };

     BootstrapTable.prototype.prevPage = function () {
         if (this.options.pageNumber > 1) {
             this.options.pageNumber--;
             this.updatePagination();
         }
     };

     BootstrapTable.prototype.nextPage = function () {
         if (this.options.pageNumber < this.options.totalPages) {
             this.options.pageNumber++;
             this.updatePagination();
         }
     };

     BootstrapTable.prototype.toggleView = function () {
         this.options.cardView = !this.options.cardView;
         this.initHeader();
         // Fixed remove toolbar when click cardView button.
         //that.initToolbar();
         this.initBody();
         this.trigger('toggle', this.options.cardView);
     };

     BootstrapTable.prototype.refreshOptions = function (options) {
         //If the objects are equivalent then avoid the call of destroy / init methods
         if (compareObjects(this.options, options, true)) {
             return;
         }
         this.options = $.extend(this.options, options);
         this.trigger('refresh-options', this.options);
         this.destroy();
         this.init();
     };

     BootstrapTable.prototype.resetSearch = function (text) {
         var $search = this.$toolbar.find('.search input');
         $search.val(text || '');
         this.onSearch({currentTarget: $search});
     };

     BootstrapTable.prototype.expandRow_ = function (expand, index) {
         var $tr = this.$body.find(sprintf('> tr[data-index="%s"]', index));
         if ($tr.next().is('tr.detail-view') === (expand ? false : true)) {
             $tr.find('> td > .detail-icon').click();
         }
     };

     BootstrapTable.prototype.expandRow = function (index) {
         this.expandRow_(true, index);
     };

     BootstrapTable.prototype.collapseRow = function (index) {
         this.expandRow_(false, index);
     };

     BootstrapTable.prototype.expandAllRows = function (isSubTable) {
         if (isSubTable) {
             var $tr = this.$body.find(sprintf('> tr[data-index="%s"]', 0)),
                 that = this,
                 detailIcon = null,
                 executeInterval = false,
                 idInterval = -1;

             if (!$tr.next().is('tr.detail-view')) {
                 $tr.find('> td > .detail-icon').click();
                 executeInterval = true;
             } else if (!$tr.next().next().is('tr.detail-view')) {
                 $tr.next().find(".detail-icon").click();
                 executeInterval = true;
             }

             if (executeInterval) {
                 try {
                     idInterval = setInterval(function () {
                         detailIcon = that.$body.find("tr.detail-view").last().find(".detail-icon");
                         if (detailIcon.length > 0) {
                             detailIcon.click();
                         } else {
                             clearInterval(idInterval);
                         }
                     }, 1);
                 } catch (ex) {
                     clearInterval(idInterval);
                 }
             }
         } else {
             var trs = this.$body.children();
             for (var i = 0; i < trs.length; i++) {
                 this.expandRow_(true, $(trs[i]).data("index"));
             }
         }
     };

     BootstrapTable.prototype.collapseAllRows = function (isSubTable) {
         if (isSubTable) {
             this.expandRow_(false, 0);
         } else {
             var trs = this.$body.children();
             for (var i = 0; i < trs.length; i++) {
                 this.expandRow_(false, $(trs[i]).data("index"));
             }
         }
     };

     BootstrapTable.prototype.updateFormatText = function (name, text) {
         if (this.options[sprintf('format%s', name)]) {
             if (typeof text === 'string') {
                 this.options[sprintf('format%s', name)] = function () {
                     return text;
                 };
             } else if (typeof text === 'function') {
                 this.options[sprintf('format%s', name)] = text;
             }
         }
         this.initToolbar();
         this.initPagination();
         this.initBody();
     };

     // BOOTSTRAP TABLE PLUGIN DEFINITION
     // =======================

     var allowedMethods = [
         'getOptions',
         'getSelections', 'getAllSelections', 'getData',
         'load', 'append', 'prepend', 'remove', 'removeAll',
         'insertRow', 'updateRow', 'updateCell', 'updateByUniqueId', 'removeByUniqueId',
         'getRowByUniqueId', 'showRow', 'hideRow', 'getHiddenRows',
         'mergeCells',
         'checkAll', 'uncheckAll', 'checkInvert',
         'check', 'uncheck',
         'checkBy', 'uncheckBy',
         'refresh',
         'resetView',
         'resetWidth',
         'destroy',
         'showLoading', 'hideLoading',
         'showColumn', 'hideColumn', 'getHiddenColumns', 'getVisibleColumns',
         'showAllColumns', 'hideAllColumns',
         'filterBy',
         'scrollTo',
         'getScrollPosition',
         'selectPage', 'prevPage', 'nextPage',
         'togglePagination',
         'toggleView',
         'refreshOptions',
         'resetSearch',
         'expandRow', 'collapseRow', 'expandAllRows', 'collapseAllRows',
         'updateFormatText'
     ];

     $.fn.bootstrapTable = function (option) {
         var value,
             args = Array.prototype.slice.call(arguments, 1);

         this.each(function () {
             var $this = $(this),
                 data = $this.data('bootstrap.table'),
                 options = $.extend({}, BootstrapTable.DEFAULTS, $this.data(),
                     typeof option === 'object' && option);

             if (typeof option === 'string') {
                 if ($.inArray(option, allowedMethods) < 0) {
                     throw new Error("Unknown method: " + option);
                 }

                 if (!data) {
                     return;
                 }

                 value = data[option].apply(data, args);

                 if (option === 'destroy') {
                     $this.removeData('bootstrap.table');
                 }
             }

             if (!data) {
                 $this.data('bootstrap.table', (data = new BootstrapTable(this, options)));
             }
         });

         return typeof value === 'undefined' ? this : value;
     };

     $.fn.bootstrapTable.Constructor = BootstrapTable;
     $.fn.bootstrapTable.defaults = BootstrapTable.DEFAULTS;
     $.fn.bootstrapTable.columnDefaults = BootstrapTable.COLUMN_DEFAULTS;
     $.fn.bootstrapTable.locales = BootstrapTable.LOCALES;
     $.fn.bootstrapTable.methods = allowedMethods;
     $.fn.bootstrapTable.utils = {
         sprintf: sprintf,
         getFieldIndex: getFieldIndex,
         compareObjects: compareObjects,
         calculateObjectValue: calculateObjectValue,
         getItemField: getItemField,
         objectKeys: objectKeys,
         isIEBrowser: isIEBrowser
     };

     // BOOTSTRAP TABLE INIT
     // =======================

     $(function () {
         $('[data-toggle="table"]').bootstrapTable();
     });
 })(jQuery);


 /**
 * @author zhixin wen <wenzhixin2010@gmail.com>
 * extensions: https://github.com/kayalshri/tableExport.jquery.plugin
 */

(function ($) {
    'use strict';
    var sprintf = $.fn.bootstrapTable.utils.sprintf;

    var TYPE_NAME = {
        json: 'JSON',
        xml: 'XML',
        png: 'PNG',
        csv: 'CSV',
        txt: 'TXT',
        sql: 'SQL',
        doc: 'MS-Word',
        excel: 'MS-Excel',
        xlsx: 'MS-Excel (OpenXML)',
        powerpoint: 'MS-Powerpoint',
        pdf: 'PDF'
    };

    $.extend($.fn.bootstrapTable.defaults, {
        showExport: false,
        exportDataType: 'basic', // basic, all, selected
        // 'json', 'xml', 'png', 'csv', 'txt', 'sql', 'doc', 'excel', 'powerpoint', 'pdf'
        exportTypes: ['json', 'xml', 'csv', 'txt', 'sql', 'excel'],
        exportOptions: {}
    });

    $.extend($.fn.bootstrapTable.defaults.icons, {
        export: 'glyphicon-export icon-share'
    });

    $.extend($.fn.bootstrapTable.locales, {
        formatExport: function () {
            return 'Export data';
        }
    });
    $.extend($.fn.bootstrapTable.defaults, $.fn.bootstrapTable.locales);

    var BootstrapTable = $.fn.bootstrapTable.Constructor,
        _initToolbar = BootstrapTable.prototype.initToolbar;

    BootstrapTable.prototype.initToolbar = function () {
        this.showToolbar = this.options.showExport;

        _initToolbar.apply(this, Array.prototype.slice.apply(arguments));

        if (this.options.showExport) {
            var that = this,
                $btnGroup = this.$toolbar.find('>.btn-group'),
                $export = $btnGroup.find('div.export');

            if (!$export.length) {
                $export = $([
                    '<div class="export btn-group">',
                        '<button class="btn' +
                            sprintf(' btn-%s', this.options.buttonsClass) +
                            sprintf(' btn-%s', this.options.iconSize) +
                            ' dropdown-toggle" aria-label="export type" ' +
                            'title="' + this.options.formatExport() + '" ' +
                            'data-toggle="dropdown" type="button">',
                            sprintf('<i class="%s %s"></i> ', this.options.iconsPrefix, this.options.icons.export),
                            sprintf('<span class="text">%s</span>', this.options.formatExport()),
                            '<span class="caret"></span>',
                        '</button>',
                        '<ul class="dropdown-menu" role="menu">',
                        '</ul>',
                    '</div>'].join('')).appendTo($btnGroup);

                var $menu = $export.find('.dropdown-menu'),
                    exportTypes = this.options.exportTypes;

                if (typeof this.options.exportTypes === 'string') {
                    var types = this.options.exportTypes.slice(1, -1).replace(/ /g, '').split(',');

                    exportTypes = [];
                    $.each(types, function (i, value) {
                        exportTypes.push(value.slice(1, -1));
                    });
                }
                $.each(exportTypes, function (i, type) {
                    if (TYPE_NAME.hasOwnProperty(type)) {
                        $menu.append(['<li role="menuitem" data-type="' + type + '">',
                                '<a href="javascript:void(0)">',
                                    TYPE_NAME[type],
                                '</a>',
                            '</li>'].join(''));
                    }
                });

                $menu.find('li').click(function () {
                    var type = $(this).data('type'),
                        doExport = function () {
                            that.$el.tableExport($.extend({}, that.options.exportOptions, {
                                type: type,
                                escape: false
                            }));
                        };

                    if (that.options.exportDataType === 'all' && that.options.pagination) {
                        that.$el.one(that.options.sidePagination === 'server' ? 'post-body.bs.table' : 'page-change.bs.table', function () {
                            doExport();
                            that.togglePagination();
                        });
                        that.togglePagination();
                    } else if (that.options.exportDataType === 'selected') {
                        var data = that.getData(),
                            selectedData = that.getAllSelections();

                        // Quick fix #2220
                        if (that.options.sidePagination === 'server') {
                            data = {total: that.options.totalRows};
                            data[that.options.dataField] = that.getData();

                            selectedData = {total: that.options.totalRows};
                            selectedData[that.options.dataField] = that.getAllSelections();
                        }

                        that.load(selectedData);
                        doExport();
                        that.load(data);
                    } else {
                        doExport();
                    }
                });
            }
        }
    };
})(jQuery);

/*
 tableExport.jquery.plugin

 Copyright (c) 2015-2017 hhurz, https://github.com/hhurz/tableExport.jquery.plugin
 Original work Copyright (c) 2014 Giri Raj, https://github.com/kayalshri/

 Licensed under the MIT License, http://opensource.org/licenses/mit-license
*/
(function(c){c.fn.extend({tableExport:function(t){function S(b){var a=[];c(b).find("thead").first().find("th").each(function(b,e){void 0!==c(e).attr("data-field")?a[b]=c(e).attr("data-field"):a[b]=b.toString()});return a}function z(b,e,f,g,w){if(-1==c.inArray(f,a.ignoreRow)&&-1==c.inArray(f-g,a.ignoreRow)){var v=c(b).filter(function(){return"none"!=c(this).data("tableexport-display")&&(c(this).is(":visible")||"always"==c(this).data("tableexport-display")||"always"==c(this).closest("table").data("tableexport-display"))}).find(e),
n=0;v.each(function(b){if("always"==c(this).data("tableexport-display")||"none"!=c(this).css("display")&&"hidden"!=c(this).css("visibility")&&"none"!=c(this).data("tableexport-display")){var e=b,g=!1;0<a.ignoreColumn.length&&("string"==typeof a.ignoreColumn[0]?H.length>e&&"undefined"!=typeof H[e]&&-1!=c.inArray(H[e],a.ignoreColumn)&&(g=!0):"number"!=typeof a.ignoreColumn[0]||-1==c.inArray(e,a.ignoreColumn)&&-1==c.inArray(e-v.length,a.ignoreColumn)||(g=!0));if(!1===g&&"function"===typeof w){var g=
0,m,d=0;if("undefined"!=typeof A[f]&&0<A[f].length)for(e=0;e<=b;e++)"undefined"!=typeof A[f][e]&&(w(null,f,e),delete A[f][e],b++);c(this).is("[colspan]")&&(g=parseInt(c(this).attr("colspan")),n+=0<g?g-1:0);c(this).is("[rowspan]")&&(d=parseInt(c(this).attr("rowspan")));w(this,f,b);for(e=0;e<g-1;e++)w(null,f,b+e);if(d)for(m=1;m<d;m++)for("undefined"==typeof A[f+m]&&(A[f+m]=[]),A[f+m][b+n]="",e=1;e<g;e++)A[f+m][b+n-e]=""}}});if("undefined"!=typeof A[f]&&0<A[f].length)for(b=0;b<=A[f].length;b++)"undefined"!=
typeof A[f][b]&&(w(null,f,b),delete A[f][b])}}function Z(b,e){!0===a.consoleLog&&console.log(b.output());if("string"===a.outputMode)return b.output();if("base64"===a.outputMode)return F(b.output());if("window"===a.outputMode)window.open(URL.createObjectURL(b.output("blob")));else try{var f=b.output("blob");saveAs(f,a.fileName+".pdf")}catch(g){C(a.fileName+".pdf","data:application/pdf"+(e?"":";base64")+",",e?f:b.output())}}function aa(b,a,f){var e=0;"undefined"!=typeof f&&(e=f.colspan);if(0<=e){for(var c=
b.width,v=b.textPos.x,n=a.table.columns.indexOf(a.column),m=1;m<e;m++)c+=a.table.columns[n+m].width;1<e&&("right"===b.styles.halign?v=b.textPos.x+c-b.width:"center"===b.styles.halign&&(v=b.textPos.x+(c-b.width)/2));b.width=c;b.textPos.x=v;"undefined"!=typeof f&&1<f.rowspan&&(b.height*=f.rowspan);if("middle"===b.styles.valign||"bottom"===b.styles.valign)f=("string"===typeof b.text?b.text.split(/\r\n|\r|\n/g):b.text).length||1,2<f&&(b.textPos.y-=(2-1.15)/2*a.row.styles.fontSize*(f-2)/3);return!0}return!1}
function ba(b,a,f){"undefined"!=typeof f.images&&a.each(function(){var a=c(this).children();if(c(this).is("img")){var e=ca(this.src);f.images[e]={url:this.src,src:this.src}}"undefined"!=typeof a&&0<a.length&&ba(b,a,f)})}function ka(b,a){function e(b){if(b.url){var e=new Image;c=++v;e.crossOrigin="Anonymous";e.onerror=e.onload=function(){if(e.complete&&(0===e.src.indexOf("data:image/")&&(e.width=b.width||e.width||0,e.height=b.height||e.height||0),e.width+e.height)){var f=document.createElement("canvas"),
g=f.getContext("2d");f.width=e.width;f.height=e.height;g.drawImage(e,0,0);b.src=f.toDataURL("image/jpeg")}--v||a(c)};e.src=b.url}}var g,c=0,v=0;if("undefined"!=typeof b.images)for(g in b.images)b.images.hasOwnProperty(g)&&e(b.images[g]);(g=v)||(a(c),g=void 0);return g}function la(b,e,f){e.each(function(){var e=c(this).children();if(c(this).is("div")){var w=N(E(this,"background-color"),[255,255,255]),v=N(E(this,"border-top-color"),[0,0,0]),n=O(this,"border-top-width",a.jspdf.unit),m=this.getBoundingClientRect(),
d=this.offsetLeft*f.dw,h=this.offsetTop*f.dh,k=m.width*f.dw,m=m.height*f.dh;f.doc.setDrawColor.apply(void 0,v);f.doc.setFillColor.apply(void 0,w);f.doc.setLineWidth(n);f.doc.rect(b.x+d,b.y+h,k,m,n?"FD":"F")}else if(c(this).is("img")&&"undefined"!=typeof f.images&&(h=ca(this.src),w=f.images[h],"undefined"!=typeof w)){v=b.width/b.height;n=this.width/this.height;d=b.width;k=b.height;h=0;n<v?(k=Math.min(b.height,this.height),d=this.width*k/this.height):n>v&&(d=Math.min(b.width,this.width),k=this.height*
d/this.width);k<b.height&&(h=(b.height-k)/2);try{f.doc.addImage(w.src,b.textPos.x,b.y+h,d,k)}catch(pa){}b.textPos.x+=d}"undefined"!=typeof e&&0<e.length&&drawCellElements(b,e,f)})}function da(b,e,a){if("function"===typeof a.onAutotableText)a.onAutotableText(a.doc,b,e);else{var g=b.textPos.x,f=b.textPos.y,v={halign:b.styles.halign,valign:b.styles.valign};if(e.length){for(e=e[0];e.previousSibling;)e=e.previousSibling;for(var n=!1,m=!1;e;){var d=c(e).text(),h=a.doc.getStringUnitWidth(d)*a.doc.internal.getFontSize();
if(c(e).is("br")||g>b.textPos.x&&g+h>b.textPos.x+b.width)g=b.textPos.x,f+=a.doc.internal.getFontSize();c(e).is("b")?n=!0:c(e).is("i")&&(m=!0);for((n||m)&&a.doc.setFontType(n&&m?"bolditalic":n?"bold":"italic");d.length&&g+h>b.textPos.x+b.width;)d=d.substring(0,d.length-1),h=a.d/*
 tableExport.jquery.plugin

 Copyright (c) 2015-2017 hhurz, https://github.com/hhurz/tableExport.jquery.plugin
 Original work Copyright (c) 2014 Giri Raj, https://github.com/kayalshri/

 Licensed under the MIT License, http://opensource.org/licenses/mit-license
*/
(function(c){c.fn.extend({tableExport:function(t){function S(b){var a=[];c(b).find("thead").first().find("th").each(function(b,e){void 0!==c(e).attr("data-field")?a[b]=c(e).attr("data-field"):a[b]=b.toString()});return a}function z(b,e,f,g,w){if(-1==c.inArray(f,a.ignoreRow)&&-1==c.inArray(f-g,a.ignoreRow)){var v=c(b).filter(function(){return"none"!=c(this).data("tableexport-display")&&(c(this).is(":visible")||"always"==c(this).data("tableexport-display")||"always"==c(this).closest("table").data("tableexport-display"))}).find(e),
n=0;v.each(function(b){if("always"==c(this).data("tableexport-display")||"none"!=c(this).css("display")&&"hidden"!=c(this).css("visibility")&&"none"!=c(this).data("tableexport-display")){var e=b,g=!1;0<a.ignoreColumn.length&&("string"==typeof a.ignoreColumn[0]?H.length>e&&"undefined"!=typeof H[e]&&-1!=c.inArray(H[e],a.ignoreColumn)&&(g=!0):"number"!=typeof a.ignoreColumn[0]||-1==c.inArray(e,a.ignoreColumn)&&-1==c.inArray(e-v.length,a.ignoreColumn)||(g=!0));if(!1===g&&"function"===typeof w){var g=
0,m,d=0;if("undefined"!=typeof A[f]&&0<A[f].length)for(e=0;e<=b;e++)"undefined"!=typeof A[f][e]&&(w(null,f,e),delete A[f][e],b++);c(this).is("[colspan]")&&(g=parseInt(c(this).attr("colspan")),n+=0<g?g-1:0);c(this).is("[rowspan]")&&(d=parseInt(c(this).attr("rowspan")));w(this,f,b);for(e=0;e<g-1;e++)w(null,f,b+e);if(d)for(m=1;m<d;m++)for("undefined"==typeof A[f+m]&&(A[f+m]=[]),A[f+m][b+n]="",e=1;e<g;e++)A[f+m][b+n-e]=""}}});if("undefined"!=typeof A[f]&&0<A[f].length)for(b=0;b<=A[f].length;b++)"undefined"!=
typeof A[f][b]&&(w(null,f,b),delete A[f][b])}}function Z(b,e){!0===a.consoleLog&&console.log(b.output());if("string"===a.outputMode)return b.output();if("base64"===a.outputMode)return F(b.output());if("window"===a.outputMode)window.open(URL.createObjectURL(b.output("blob")));else try{var f=b.output("blob");saveAs(f,a.fileName+".pdf")}catch(g){C(a.fileName+".pdf","data:application/pdf"+(e?"":";base64")+",",e?f:b.output())}}function aa(b,a,f){var e=0;"undefined"!=typeof f&&(e=f.colspan);if(0<=e){for(var c=
b.width,v=b.textPos.x,n=a.table.columns.indexOf(a.column),m=1;m<e;m++)c+=a.table.columns[n+m].width;1<e&&("right"===b.styles.halign?v=b.textPos.x+c-b.width:"center"===b.styles.halign&&(v=b.textPos.x+(c-b.width)/2));b.width=c;b.textPos.x=v;"undefined"!=typeof f&&1<f.rowspan&&(b.height*=f.rowspan);if("middle"===b.styles.valign||"bottom"===b.styles.valign)f=("string"===typeof b.text?b.text.split(/\r\n|\r|\n/g):b.text).length||1,2<f&&(b.textPos.y-=(2-1.15)/2*a.row.styles.fontSize*(f-2)/3);return!0}return!1}
function ba(b,a,f){"undefined"!=typeof f.images&&a.each(function(){var a=c(this).children();if(c(this).is("img")){var e=ca(this.src);f.images[e]={url:this.src,src:this.src}}"undefined"!=typeof a&&0<a.length&&ba(b,a,f)})}function ka(b,a){function e(b){if(b.url){var e=new Image;c=++v;e.crossOrigin="Anonymous";e.onerror=e.onload=function(){if(e.complete&&(0===e.src.indexOf("data:image/")&&(e.width=b.width||e.width||0,e.height=b.height||e.height||0),e.width+e.height)){var f=document.createElement("canvas"),
g=f.getContext("2d");f.width=e.width;f.height=e.height;g.drawImage(e,0,0);b.src=f.toDataURL("image/jpeg")}--v||a(c)};e.src=b.url}}var g,c=0,v=0;if("undefined"!=typeof b.images)for(g in b.images)b.images.hasOwnProperty(g)&&e(b.images[g]);(g=v)||(a(c),g=void 0);return g}function la(b,e,f){e.each(function(){var e=c(this).children();if(c(this).is("div")){var w=N(E(this,"background-color"),[255,255,255]),v=N(E(this,"border-top-color"),[0,0,0]),n=O(this,"border-top-width",a.jspdf.unit),m=this.getBoundingClientRect(),
d=this.offsetLeft*f.dw,h=this.offsetTop*f.dh,k=m.width*f.dw,m=m.height*f.dh;f.doc.setDrawColor.apply(void 0,v);f.doc.setFillColor.apply(void 0,w);f.doc.setLineWidth(n);f.doc.rect(b.x+d,b.y+h,k,m,n?"FD":"F")}else if(c(this).is("img")&&"undefined"!=typeof f.images&&(h=ca(this.src),w=f.images[h],"undefined"!=typeof w)){v=b.width/b.height;n=this.width/this.height;d=b.width;k=b.height;h=0;n<v?(k=Math.min(b.height,this.height),d=this.width*k/this.height):n>v&&(d=Math.min(b.width,this.width),k=this.height*
d/this.width);k<b.height&&(h=(b.height-k)/2);try{f.doc.addImage(w.src,b.textPos.x,b.y+h,d,k)}catch(pa){}b.textPos.x+=d}"undefined"!=typeof e&&0<e.length&&drawCellElements(b,e,f)})}function da(b,e,a){if("function"===typeof a.onAutotableText)a.onAutotableText(a.doc,b,e);else{var g=b.textPos.x,f=b.textPos.y,v={halign:b.styles.halign,valign:b.styles.valign};if(e.length){for(e=e[0];e.previousSibling;)e=e.previousSibling;for(var n=!1,m=!1;e;){var d=c(e).text(),h=a.doc.getStringUnitWidth(d)*a.doc.internal.getFontSize();
if(c(e).is("br")||g>b.textPos.x&&g+h>b.textPos.x+b.width)g=b.textPos.x,f+=a.doc.internal.getFontSize();c(e).is("b")?n=!0:c(e).is("i")&&(m=!0);for((n||m)&&a.doc.setFontType(n&&m?"bolditalic":n?"bold":"italic");d.length&&g+h>b.textPos.x+b.width;)d=d.substring(0,d.length-1),h=a.doc.getStringUnitWidth(d)*a.doc.internal.getFontSize();a.doc.autoTableText(d,g,f,v);g+=h;if(n||m)c(e).is("b")?n=!1:c(e).is("i")&&(m=!1),a.doc.setFontType(n||m?n?"bold":"italic":"normal");e=e.nextSibling}b.textPos.x=g;b.textPos.y=
f}else a.doc.autoTableText(b.text,g,f,v)}}function P(b,a,f){return b.replace(new RegExp(a.replace(/([.*+?^=!:${}()|\[\]\/\\])/g,"\\$1"),"g"),f)}function ea(b){b=P(b||"0",a.numbers.html.thousandsSeparator,"");b=P(b,a.numbers.html.decimalMark,".");return"number"===typeof b||!1!==jQuery.isNumeric(b)?b:!1}function x(b,e,f){var g="";if(null!==b){var w=c(b),d;if(w[0].hasAttribute("data-tableexport-value"))d=w.data("tableexport-value");else if(d=w.html(),"function"===typeof a.onCellHtmlData)d=a.onCellHtmlData(w,
e,f,d);else if(""!=d){b=c.parseHTML(d);var n=0,m=0;d="";c.each(b,function(){if(c(this).is("input"))d+=w.find("input").eq(n++).val();else if(c(this).is("select"))d+=w.find("select option:selected").eq(m++).text();else if("undefined"===typeof c(this).html())d+=c(this).text();else if(void 0===jQuery().bootstrapTable||!0!==c(this).hasClass("filterControl"))d+=c(this).html()})}if(!0===a.htmlContent)g=c.trim(d);else if(""!=d){var h=d.replace(/\n/g,"\u2028").replace(/<br\s*[\/]?>/gi,"\u2060");b=c("<div/>").html(h).contents();
h="";c.each(b.text().split("\u2028"),function(b,a){0<b&&(h+=" ");h+=c.trim(a)});c.each(h.split("\u2060"),function(b,a){0<b&&(g+="\n");g+=c.trim(a).replace(/\u00AD/g,"")});if("json"==a.type||!1===a.numbers.output)b=ea(g),!1!==b&&(g=Number(b));else if(a.numbers.html.decimalMark!=a.numbers.output.decimalMark||a.numbers.html.thousandsSeparator!=a.numbers.output.thousandsSeparator)if(b=ea(g),!1!==b){var k=(""+b).split(".");1==k.length&&(k[1]="");var l=3<k[0].length?k[0].length%3:0,g=(0>b?"-":"")+(a.numbers.output.thousandsSeparator?
(l?k[0].substr(0,l)+a.numbers.output.thousandsSeparator:"")+k[0].substr(l).replace(/(\d{3})(?=\d)/g,"$1"+a.numbers.output.thousandsSeparator):k[0])+(k[1].length?a.numbers.output.decimalMark+k[1]:"")}}!0===a.escape&&(g=escape(g));"function"===typeof a.onCellData&&(g=a.onCellData(w,e,f,g))}return g}function ma(b,a,f){return a+"-"+f.toLowerCase()}function N(b,a){var e=/^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/.exec(b),g=a;e&&(g=[parseInt(e[1]),parseInt(e[2]),parseInt(e[3])]);return g}function fa(b){var a=
E(b,"text-align"),f=E(b,"font-weight"),g=E(b,"font-style"),d="";"start"==a&&(a="rtl"==E(b,"direction")?"right":"left");700<=f&&(d="bold");"italic"==g&&(d+=g);""===d&&(d="normal");a={style:{align:a,bcolor:N(E(b,"background-color"),[255,255,255]),color:N(E(b,"color"),[0,0,0]),fstyle:d},colspan:parseInt(c(b).attr("colspan"))||0,rowspan:parseInt(c(b).attr("rowspan"))||0};null!==b&&(b=b.getBoundingClientRect(),a.rect={width:b.width,height:b.height});return a}function E(b,a){try{return window.getComputedStyle?
(a=a.replace(/([a-z])([A-Z])/,ma),window.getComputedStyle(b,null).getPropertyValue(a)):b.currentStyle?b.currentStyle[a]:b.style[a]}catch(f){}return""}function O(b,a,f){a=E(b,a).match(/\d+/);if(null!==a){a=a[0];b=b.parentElement;var e=document.createElement("div");e.style.overflow="hidden";e.style.visibility="hidden";b.appendChild(e);e.style.width=100+f;f=100/e.offsetWidth;b.removeChild(e);return a*f}return 0}function T(){if(!(this instanceof T))return new T;this.SheetNames=[];this.Sheets={}}function na(a){for(var b=
new ArrayBuffer(a.length),f=new Uint8Array(b),g=0;g!=a.length;++g)f[g]=a.charCodeAt(g)&255;return b}function oa(a){for(var b={},f={s:{c:1E7,r:1E7},e:{c:0,r:0}},g=0;g!=a.length;++g)for(var c=0;c!=a[g].length;++c){f.s.r>g&&(f.s.r=g);f.s.c>c&&(f.s.c=c);f.e.r<g&&(f.e.r=g);f.e.c<c&&(f.e.c=c);var d={v:a[g][c]};if(null!==d.v){var n=XLSX.utils.encode_cell({c:c,r:g});if("number"===typeof d.v)d.t="n";else if("boolean"===typeof d.v)d.t="b";else if(d.v instanceof Date){d.t="n";d.z=XLSX.SSF._table[14];var m=d,
h;h=(Date.parse(d.v)-new Date(Date.UTC(1899,11,30)))/864E5;m.v=h}else d.t="s";b[n]=d}}1E7>f.s.c&&(b["!ref"]=XLSX.utils.encode_range(f));return b}function ca(a){var b=0,c,g,d;if(0===a.length)return b;c=0;for(d=a.length;c<d;c++)g=a.charCodeAt(c),b=(b<<5)-b+g,b|=0;return b}function C(a,e,c){var b=window.navigator.userAgent;if(!1!==a&&(0<b.indexOf("MSIE ")||b.match(/Trident.*rv\:11\./)))if(window.navigator.msSaveOrOpenBlob)window.navigator.msSaveOrOpenBlob(new Blob([c]),a);else{if(e=document.createElement("iframe"))document.body.appendChild(e),
e.setAttribute("style","display:none"),e.contentDocument.open("txt/html","replace"),e.contentDocument.write(c),e.contentDocument.close(),e.focus(),e.contentDocument.execCommand("SaveAs",!0,a),document.body.removeChild(e)}else if(b=document.createElement("a")){var f=null;b.style.display="none";!1!==a?b.download=a:b.target="_blank";"object"==typeof c?(f=window.URL.createObjectURL(c),b.href=f):0<=e.toLowerCase().indexOf("base64,")?b.href=e+F(c):b.href=e+encodeURIComponent(c);document.body.appendChild(b);
if(document.createEvent)null===Q&&(Q=document.createEvent("MouseEvents")),Q.initEvent("click",!0,!1),b.dispatchEvent(Q);else if(document.createEventObject)b.fireEvent("onclick");else if("function"==typeof b.onclick)b.onclick();f&&window.URL.revokeObjectURL(f);document.body.removeChild(b)}}function F(a){var b="",c,g,d,h,n,m,k=0;a=a.replace(/\x0d\x0a/g,"\n");g="";for(d=0;d<a.length;d++)h=a.charCodeAt(d),128>h?g+=String.fromCharCode(h):(127<h&&2048>h?g+=String.fromCharCode(h>>6|192):(g+=String.fromCharCode(h>>
12|224),g+=String.fromCharCode(h>>6&63|128)),g+=String.fromCharCode(h&63|128));for(a=g;k<a.length;)c=a.charCodeAt(k++),g=a.charCodeAt(k++),d=a.charCodeAt(k++),h=c>>2,c=(c&3)<<4|g>>4,n=(g&15)<<2|d>>6,m=d&63,isNaN(g)?n=m=64:isNaN(d)&&(m=64),b=b+"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(h)+"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(c)+"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(n)+"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(m);
return b}var a={consoleLog:!1,csvEnclosure:'"',csvSeparator:",",csvUseBOM:!0,displayTableName:!1,escape:!1,excelstyles:[],fileName:"tableExport",htmlContent:!1,ignoreColumn:[],ignoreRow:[],jsonScope:"all",jspdf:{orientation:"p",unit:"pt",format:"a4",margins:{left:20,right:10,top:10,bottom:10},autotable:{styles:{cellPadding:2,rowHeight:12,fontSize:8,fillColor:255,textColor:50,fontStyle:"normal",overflow:"ellipsize",halign:"left",valign:"middle"},headerStyles:{fillColor:[52,73,94],textColor:255,fontStyle:"bold",
halign:"center"},alternateRowStyles:{fillColor:245},tableExport:{onAfterAutotable:null,onBeforeAutotable:null,onAutotableText:null,onTable:null,outputImages:!0}}},numbers:{html:{decimalMark:".",thousandsSeparator:","},output:{decimalMark:".",thousandsSeparator:","}},onCellData:null,onCellHtmlData:null,outputMode:"file",pdfmake:{enabled:!1},tbodySelector:"tr",tfootSelector:"tr",theadSelector:"tr",tableName:"myTableName",type:"csv",worksheetName:"xlsWorksheetName"},r=this,Q=null,p=[],h=[],k=0,A=[],
l="",H=[],y;c.extend(!0,a,t);H=S(r);if("csv"==a.type||"tsv"==a.type||"txt"==a.type){var D="",I=0,k=0,U=function(b,e,f){b.each(function(){l="";z(this,e,k,f+b.length,function(b,c,e){var f=l,d="";if(null!==b)if(b=x(b,c,e),c=null===b||""===b?"":b.toString(),"tsv"==a.type)b instanceof Date&&b.toLocaleString(),d=P(c,"\t"," ");else if(b instanceof Date)d=a.csvEnclosure+b.toLocaleString()+a.csvEnclosure;else if(d=P(c,a.csvEnclosure,a.csvEnclosure+a.csvEnclosure),0<=d.indexOf(a.csvSeparator)||/[\r\n ]/g.test(d))d=
a.csvEnclosure+d+a.csvEnclosure;l=f+(d+("tsv"==a.type?"\t":a.csvSeparator))});l=c.trim(l).substring(0,l.length-1);0<l.length&&(0<D.length&&(D+="\n"),D+=l);k++});return b.length},I=I+U(c(r).find("thead").first().find(a.theadSelector),"th,td",I);c(r).find("tbody").each(function(){I+=U(c(this).find(a.tbodySelector),"td,th",I)});a.tfootSelector.length&&U(c(r).find("tfoot").first().find(a.tfootSelector),"td,th",I);D+="\n";!0===a.consoleLog&&console.log(D);if("string"===a.outputMode)return D;if("base64"===
a.outputMode)return F(D);if("window"===a.outputMode){C(!1,"data:text/"+("csv"==a.type?"csv":"plain")+";charset=utf-8,",D);return}try{y=new Blob([D],{type:"text/"+("csv"==a.type?"csv":"plain")+";charset=utf-8"}),saveAs(y,a.fileName+"."+a.type,"csv"!=a.type||!1===a.csvUseBOM)}catch(b){C(a.fileName+"."+a.type,"data:text/"+("csv"==a.type?"csv":"plain")+";charset=utf-8,"+("csv"==a.type&&a.csvUseBOM?"\ufeff":""),D)}}else if("sql"==a.type){var k=0,u="INSERT INTO `"+a.tableName+"` (",p=c(r).find("thead").first().find(a.theadSelector);
p.each(function(){z(this,"th,td",k,p.length,function(a,c,f){u+="'"+x(a,c,f)+"',"});k++;u=c.trim(u);u=c.trim(u).substring(0,u.length-1)});u+=") VALUES ";c(r).find("tbody").each(function(){h.push.apply(h,c(this).find(a.tbodySelector))});a.tfootSelector.length&&h.push.apply(h,c(r).find("tfoot").find(a.tfootSelector));c(h).each(function(){l="";z(this,"td,th",k,p.length+h.length,function(a,c,f){l+="'"+x(a,c,f)+"',"});3<l.length&&(u+="("+l,u=c.trim(u).substring(0,u.length-1),u+="),");k++});u=c.trim(u).substring(0,
u.length-1);u+=";";!0===a.consoleLog&&console.log(u);if("string"===a.outputMode)return u;if("base64"===a.outputMode)return F(u);try{y=new Blob([u],{type:"text/plain;charset=utf-8"}),saveAs(y,a.fileName+".sql")}catch(b){C(a.fileName+".sql","data:application/sql;charset=utf-8,",u)}}else if("json"==a.type){var J=[],p=c(r).find("thead").first().find(a.theadSelector);p.each(function(){var a=[];z(this,"th,td",k,p.length,function(b,c,d){a.push(x(b,c,d))});J.push(a)});var V=[];c(r).find("tbody").each(function(){h.push.apply(h,
c(this).find(a.tbodySelector))});a.tfootSelector.length&&h.push.apply(h,c(r).find("tfoot").find(a.tfootSelector));c(h).each(function(){var a={},e=0;z(this,"td,th",k,p.length+h.length,function(b,c,d){J.length?a[J[J.length-1][e]]=x(b,c,d):a[e]=x(b,c,d);e++});!1===c.isEmptyObject(a)&&V.push(a);k++});t="";t="head"==a.jsonScope?JSON.stringify(J):"data"==a.jsonScope?JSON.stringify(V):JSON.stringify({header:J,data:V});!0===a.consoleLog&&console.log(t);if("string"===a.outputMode)return t;if("base64"===a.outputMode)return F(t);
try{y=new Blob([t],{type:"application/json;charset=utf-8"}),saveAs(y,a.fileName+".json")}catch(b){C(a.fileName+".json","data:application/json;charset=utf-8;base64,",t)}}else if("xml"===a.type){var k=0,B='<?xml version="1.0" encoding="utf-8"?>',B=B+"<tabledata><fields>",p=c(r).find("thead").first().find(a.theadSelector);p.each(function(){z(this,"th,td",k,p.length,function(a,c,d){B+="<field>"+x(a,c,d)+"</field>"});k++});var B=B+"</fields><data>",ga=1;c(r).find("tbody").each(function(){h.push.apply(h,
c(this).find(a.tbodySelector))});a.tfootSelector.length&&h.push.apply(h,c(r).find("tfoot").find(a.tfootSelector));c(h).each(function(){var a=1;l="";z(this,"td,th",k,p.length+h.length,function(b,c,d){l+="<column-"+a+">"+x(b,c,d)+"</column-"+a+">";a++});0<l.length&&"<column-1></column-1>"!=l&&(B+='<row id="'+ga+'">'+l+"</row>",ga++);k++});B+="</data></tabledata>";!0===a.consoleLog&&console.log(B);if("string"===a.outputMode)return B;if("base64"===a.outputMode)return F(B);try{y=new Blob([B],{type:"application/xml;charset=utf-8"}),
saveAs(y,a.fileName+".xml")}catch(b){C(a.fileName+".xml","data:application/xml;charset=utf-8;base64,",B)}}else if("excel"==a.type||"xls"==a.type||"word"==a.type||"doc"==a.type){t="excel"==a.type||"xls"==a.type?"excel":"word";var K="excel"==t?"xls":"doc",q='xmlns:x="urn:schemas-microsoft-com:office:'+t+'"',G="";c(r).filter(function(){return"none"!=c(this).data("tableexport-display")&&(c(this).is(":visible")||"always"==c(this).data("tableexport-display"))}).each(function(){var b=c(this);k=0;H=S(this);
G+="<table><thead>";p=b.find("thead").first().find(a.theadSelector);p.each(function(){l="";z(this,"th,td",k,p.length,function(b,d,g){if(null!==b){var e="";l+="<th";for(var f in a.excelstyles)if(a.excelstyles.hasOwnProperty(f)){var n=c(b).css(a.excelstyles[f]);""!==n&&"0px none rgb(0, 0, 0)"!=n&&"rgba(0, 0, 0, 0)"!=n&&(e+=""===e?'style="':";",e+=a.excelstyles[f]+":"+n)}""!==e&&(l+=" "+e+'"');c(b).is("[colspan]")&&(l+=' colspan="'+c(b).attr("colspan")+'"');c(b).is("[rowspan]")&&(l+=' rowspan="'+c(b).attr("rowspan")+
'"');l+=">"+x(b,d,g)+"</th>"}});0<l.length&&(G+="<tr>"+l+"</tr>");k++});G+="</thead><tbody>";b.find("tbody").each(function(){h.push.apply(h,c(this).find(a.tbodySelector))});a.tfootSelector.length&&h.push.apply(h,b.find("tfoot").find(a.tfootSelector));c(h).each(function(){var b=c(this);l="";z(this,"td,th",k,p.length+h.length,function(e,d,h){if(null!==e){var f="",g=c(e).data("tableexport-msonumberformat");"undefined"==typeof g&&"function"===typeof a.onMsoNumberFormat&&(g=a.onMsoNumberFormat(e,d,h));
"undefined"!=typeof g&&""!==g&&(f="style=\"mso-number-format:'"+g+"'");for(var m in a.excelstyles)a.excelstyles.hasOwnProperty(m)&&(g=c(e).css(a.excelstyles[m]),""===g&&(g=b.css(a.excelstyles[m])),""!==g&&"0px none rgb(0, 0, 0)"!=g&&"rgba(0, 0, 0, 0)"!=g&&(f+=""===f?'style="':";",f+=a.excelstyles[m]+":"+g));l+="<td";""!==f&&(l+=" "+f+'"');c(e).is("[colspan]")&&(l+=' colspan="'+c(e).attr("colspan")+'"');c(e).is("[rowspan]")&&(l+=' rowspan="'+c(e).attr("rowspan")+'"');l+=">"+x(e,d,h).replace(/\n/g,
"<br>")+"</td>"}});0<l.length&&(G+="<tr>"+l+"</tr>");k++});a.displayTableName&&(G+="<tr><td></td></tr><tr><td></td></tr><tr><td>"+x(c("<p>"+a.tableName+"</p>"))+"</td></tr>");G+="</tbody></table>";!0===a.consoleLog&&console.log(G)});q='<html xmlns:o="urn:schemas-microsoft-com:office:office" '+q+' xmlns="http://www.w3.org/TR/REC-html40">'+('<meta http-equiv="content-type" content="application/vnd.ms-'+t+'; charset=UTF-8">')+"<head>";"excel"===t&&(q+="\x3c!--[if gte mso 9]>",q+="<xml>",q+="<x:ExcelWorkbook>",
q+="<x:ExcelWorksheets>",q+="<x:ExcelWorksheet>",q+="<x:Name>",q+=a.worksheetName,q+="</x:Name>",q+="<x:WorksheetOptions>",q+="<x:DisplayGridlines/>",q+="</x:WorksheetOptions>",q+="</x:ExcelWorksheet>",q+="</x:ExcelWorksheets>",q+="</x:ExcelWorkbook>",q+="</xml>",q+="<![endif]--\x3e");q+="<style>br {mso-data-placement:same-cell;}</style>";q+="</head>";q+="<body>";q+=G;q+="</body>";q+="</html>";!0===a.consoleLog&&console.log(q);if("string"===a.outputMode)return q;if("base64"===a.outputMode)return F(q);
try{y=new Blob([q],{type:"application/vnd.ms-"+a.type}),saveAs(y,a.fileName+"."+K)}catch(b){C(a.fileName+"."+K,"data:application/vnd.ms-"+t+";base64,",q)}}else if("xlsx"==a.type){var ha=[],W=[],k=0,h=c(r).find("thead").first().find(a.theadSelector);c(r).find("tbody").each(function(){h.push.apply(h,c(this).find(a.tbodySelector))});a.tfootSelector.length&&h.push.apply(h,c(r).find("tfoot").find(a.tfootSelector));c(h).each(function(){var a=[];z(this,"th,td",k,h.length,function(b,c,d){if("undefined"!==
typeof b&&null!==b){var e=parseInt(b.getAttribute("colspan")),f=parseInt(b.getAttribute("rowspan"));b=x(b,c,d);""!==b&&b==+b&&(b=+b);W.forEach(function(b){if(k>=b.s.r&&k<=b.e.r&&a.length>=b.s.c&&a.length<=b.e.c)for(var c=0;c<=b.e.c-b.s.c;++c)a.push(null)});if(f||e)e=e||1,W.push({s:{r:k,c:a.length},e:{r:k+(f||1)-1,c:a.length+e-1}});a.push(""!==b?b:null);if(e)for(f=0;f<e-1;++f)a.push(null)}});ha.push(a);k++});t=new T;K=oa(ha);K["!merges"]=W;t.SheetNames.push(a.worksheetName);t.Sheets[a.worksheetName]=
K;t=XLSX.write(t,{bookType:a.type,bookSST:!1,type:"binary"});try{y=new Blob([na(t)],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"}),saveAs(y,a.fileName+"."+a.type)}catch(b){C(a.fileName+"."+a.type,"data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8,",y)}}else if("png"==a.type)html2canvas(c(r)[0]).then(function(b){b=b.toDataURL();for(var c=atob(b.substring(22)),d=new ArrayBuffer(c.length),g=new Uint8Array(d),h=0;h<c.length;h++)g[h]=
c.charCodeAt(h);!0===a.consoleLog&&console.log(c);if("string"===a.outputMode)return c;if("base64"===a.outputMode)return F(b);if("window"===a.outputMode)window.open(b);else try{y=new Blob([d],{type:"image/png"}),saveAs(y,a.fileName+".png")}catch(v){C(a.fileName+".png","data:image/png,",y)}});else if("pdf"==a.type)if(!0===a.pdfmake.enabled){var X=[],Y=[],k=0,p=c(this).find("thead").first().find(a.theadSelector);p.each(function(){var a=[];z(this,"th,td",k,p.length,function(b,c,d){a.push(x(b,c,d))});
a.length&&Y.push(a);for(var c=X.length;c<a.length;c++)X.push("*");k++});c(this).find("tbody").each(function(){h.push.apply(h,c(this).find(a.tbodySelector))});a.tfootSelector.length&&h.push.apply(h,c(this).find("tfoot").find(a.tfootSelector));c(h).each(function(){var a=[];z(this,"td,th",k,p.length+h.length,function(b,c,d){a.push(x(b,c,d))});a.length&&Y.push(a);k++});pdfMake.createPdf({pageOrientation:"landscape",content:[{table:{headerRows:p.length,widths:X,body:Y}}]}).getBuffer(function(b){try{var c=
new Blob([b],{type:"application/pdf"});saveAs(c,a.fileName+".pdf")}catch(f){C(a.fileName+".pdf","data:application/pdf;base64,",b)}})}else if(!1===a.jspdf.autotable){t={dim:{w:O(c(r).first().get(0),"width","mm"),h:O(c(r).first().get(0),"height","mm")},pagesplit:!1};var ia=new jsPDF(a.jspdf.orientation,a.jspdf.unit,a.jspdf.format);ia.addHTML(c(r).first(),a.jspdf.margins.left,a.jspdf.margins.top,t,function(){Z(ia,!1)})}else{var d=a.jspdf.autotable.tableExport;if("string"===typeof a.jspdf.format&&"bestfit"===
a.jspdf.format.toLowerCase()){var L={a0:[2383.94,3370.39],a1:[1683.78,2383.94],a2:[1190.55,1683.78],a3:[841.89,1190.55],a4:[595.28,841.89]},R="",M="",ja=0;c(r).filter(":visible").each(function(){if("none"!=c(this).css("display")){var a=O(c(this).get(0),"width","pt");if(a>ja){a>L.a0[0]&&(R="a0",M="l");for(var d in L)L.hasOwnProperty(d)&&L[d][1]>a&&(R=d,M="l",L[d][0]>a&&(M="p"));ja=a}}});a.jspdf.format=""===R?"a4":R;a.jspdf.orientation=""===M?"w":M}d.doc=new jsPDF(a.jspdf.orientation,a.jspdf.unit,a.jspdf.format);
!0===d.outputImages&&(d.images={});"undefined"!=typeof d.images&&(c(r).filter(function(){return"none"!=c(this).data("tableexport-display")&&(c(this).is(":visible")||"always"==c(this).data("tableexport-display"))}).each(function(){var b=0;p=c(this).find("thead").find(a.theadSelector);c(this).find("tbody").each(function(){h.push.apply(h,c(this).find(a.tbodySelector))});a.tfootSelector.length&&h.push.apply(h,c(this).find("tfoot").find(a.tfootSelector));c(h).each(function(){z(this,"td,th",p.length+b,
p.length+h.length,function(a,b,g){"undefined"!==typeof a&&null!==a&&(b=c(a).children(),"undefined"!=typeof b&&0<b.length&&ba(a,b,d))});b++})}),p=[],h=[]);ka(d,function(b){c(r).filter(function(){return"none"!=c(this).data("tableexport-display")&&(c(this).is(":visible")||"always"==c(this).data("tableexport-display"))}).each(function(){var b,f=0;H=S(this);d.columns=[];d.rows=[];d.rowoptions={};if("function"===typeof d.onTable&&!1===d.onTable(c(this),a))return!0;a.jspdf.autotable.tableExport=null;var g=
c.extend(!0,{},a.jspdf.autotable);a.jspdf.autotable.tableExport=d;g.margin={};c.extend(!0,g.margin,a.jspdf.margins);g.tableExport=d;"function"!==typeof g.beforePageContent&&(g.beforePageContent=function(a){1==a.pageCount&&a.table.rows.concat(a.table.headerRow).forEach(function(b){0<b.height&&(b.height+=(2-1.15)/2*b.styles.fontSize,a.table.height+=(2-1.15)/2*b.styles.fontSize)})});"function"!==typeof g.createdHeaderCell&&(g.createdHeaderCell=function(a,b){a.styles=c.extend({},b.row.styles);if("undefined"!=
typeof d.columns[b.column.dataKey]){var e=d.columns[b.column.dataKey];if("undefined"!=typeof e.rect){var f;a.contentWidth=e.rect.width;if("undefined"==typeof d.heightRatio||0===d.heightRatio)f=b.row.raw[b.column.dataKey].rowspan?b.row.raw[b.column.dataKey].rect.height/b.row.raw[b.column.dataKey].rowspan:b.row.raw[b.column.dataKey].rect.height,d.heightRatio=a.styles.rowHeight/f;f=b.row.raw[b.column.dataKey].rect.height*d.heightRatio;f>a.styles.rowHeight&&(a.styles.rowHeight=f)}"undefined"!=typeof e.style&&
!0!==e.style.hidden&&(a.styles.halign=e.style.align,"inherit"===g.styles.fillColor&&(a.styles.fillColor=e.style.bcolor),"inherit"===g.styles.textColor&&(a.styles.textColor=e.style.color),"inherit"===g.styles.fontStyle&&(a.styles.fontStyle=e.style.fstyle))}});"function"!==typeof g.createdCell&&(g.createdCell=function(a,b){var c=d.rowoptions[b.row.index+":"+b.column.dataKey];"undefined"!=typeof c&&"undefined"!=typeof c.style&&!0!==c.style.hidden&&(a.styles.halign=c.style.align,"inherit"===g.styles.fillColor&&
(a.styles.fillColor=c.style.bcolor),"inherit"===g.styles.textColor&&(a.styles.textColor=c.style.color),"inherit"===g.styles.fontStyle&&(a.styles.fontStyle=c.style.fstyle))});"function"!==typeof g.drawHeaderCell&&(g.drawHeaderCell=function(a,b){var c=d.columns[b.column.dataKey];return(!0!==c.style.hasOwnProperty("hidden")||!0!==c.style.hidden)&&0<=c.rowIndex?aa(a,b,c):!1});"function"!==typeof g.drawCell&&(g.drawCell=function(a,b){var c=d.rowoptions[b.row.index+":"+b.column.dataKey];if(aa(a,b,c))if(d.doc.rect(a.x,
a.y,a.width,a.height,a.styles.fillStyle),"undefined"!=typeof c&&"undefined"!=typeof c.kids&&0<c.kids.length){var e=a.height/c.rect.height;if(e>d.dh||"undefined"==typeof d.dh)d.dh=e;d.dw=a.width/c.rect.width;la(a,c.kids,d);da(a,c.kids,d)}else da(a,{},d);return!1});d.headerrows=[];p=c(this).find("thead").find(a.theadSelector);p.each(function(){b=0;d.headerrows[f]=[];z(this,"th,td",f,p.length,function(a,c,e){var g=fa(a);g.title=x(a,c,e);g.key=b++;g.rowIndex=f;d.headerrows[f].push(g)});f++});if(0<f)for(var k=
f-1;0<=k;)c.each(d.headerrows[k],function(){var a=this;0<k&&null===this.rect&&(a=d.headerrows[k-1][this.key]);null!==a&&0<=a.rowIndex&&(!0!==a.style.hasOwnProperty("hidden")||!0!==a.style.hidden)&&d.columns.push(a)}),k=0<d.columns.length?-1:k-1;var l=0;h=[];c(this).find("tbody").each(function(){h.push.apply(h,c(this).find(a.tbodySelector))});a.tfootSelector.length&&h.push.apply(h,c(this).find("tfoot").find(a.tfootSelector));c(h).each(function(){var a=[];b=0;z(this,"td,th",f,p.length+h.length,function(e,
f,g){if("undefined"===typeof d.columns[b]){var h={title:"",key:b,style:{hidden:!0}};d.columns.push(h)}"undefined"!==typeof e&&null!==e?(h=fa(e),h.kids=c(e).children()):(h=c.extend(!0,{},d.rowoptions[l+":"+(b-1)]),h.colspan=-1);d.rowoptions[l+":"+b++]=h;a.push(x(e,f,g))});a.length&&(d.rows.push(a),l++);f++});if("function"===typeof d.onBeforeAutotable)d.onBeforeAutotable(c(this),d.columns,d.rows,g);d.doc.autoTable(d.columns,d.rows,g);if("function"===typeof d.onAfterAutotable)d.onAfterAutotable(c(this),
g);a.jspdf.autotable.startY=d.doc.autoTableEndPosY()+g.margin.top});Z(d.doc,"undefined"!=typeof d.images&&!1===jQuery.isEmptyObject(d.images));"undefined"!=typeof d.headerrows&&(d.headerrows.length=0);"undefined"!=typeof d.columns&&(d.columns.length=0);"undefined"!=typeof d.rows&&(d.rows.length=0);delete d.doc;d.doc=null})}return this}})})(jQuery);oc.getStringUnitWidth(d)*a.doc.internal.getFontSize();a.doc.autoTableText(d,g,f,v);g+=h;if(n||m)c(e).is("b")?n=!1:c(e).is("i")&&(m=!1),a.doc.setFontType(n||m?n?"bold":"italic":"normal");e=e.nextSibling}b.textPos.x=g;b.textPos.y=
f}else a.doc.autoTableText(b.text,g,f,v)}}function P(b,a,f){return b.replace(new RegExp(a.replace(/([.*+?^=!:${}()|\[\]\/\\])/g,"\\$1"),"g"),f)}function ea(b){b=P(b||"0",a.numbers.html.thousandsSeparator,"");b=P(b,a.numbers.html.decimalMark,".");return"number"===typeof b||!1!==jQuery.isNumeric(b)?b:!1}function x(b,e,f){var g="";if(null!==b){var w=c(b),d;if(w[0].hasAttribute("data-tableexport-value"))d=w.data("tableexport-value");else if(d=w.html(),"function"===typeof a.onCellHtmlData)d=a.onCellHtmlData(w,
e,f,d);else if(""!=d){b=c.parseHTML(d);var n=0,m=0;d="";c.each(b,function(){if(c(this).is("input"))d+=w.find("input").eq(n++).val();else if(c(this).is("select"))d+=w.find("select option:selected").eq(m++).text();else if("undefined"===typeof c(this).html())d+=c(this).text();else if(void 0===jQuery().bootstrapTable||!0!==c(this).hasClass("filterControl"))d+=c(this).html()})}if(!0===a.htmlContent)g=c.trim(d);else if(""!=d){var h=d.replace(/\n/g,"\u2028").replace(/<br\s*[\/]?>/gi,"\u2060");b=c("<div/>").html(h).contents();
h="";c.each(b.text().split("\u2028"),function(b,a){0<b&&(h+=" ");h+=c.trim(a)});c.each(h.split("\u2060"),function(b,a){0<b&&(g+="\n");g+=c.trim(a).replace(/\u00AD/g,"")});if("json"==a.type||!1===a.numbers.output)b=ea(g),!1!==b&&(g=Number(b));else if(a.numbers.html.decimalMark!=a.numbers.output.decimalMark||a.numbers.html.thousandsSeparator!=a.numbers.output.thousandsSeparator)if(b=ea(g),!1!==b){var k=(""+b).split(".");1==k.length&&(k[1]="");var l=3<k[0].length?k[0].length%3:0,g=(0>b?"-":"")+(a.numbers.output.thousandsSeparator?
(l?k[0].substr(0,l)+a.numbers.output.thousandsSeparator:"")+k[0].substr(l).replace(/(\d{3})(?=\d)/g,"$1"+a.numbers.output.thousandsSeparator):k[0])+(k[1].length?a.numbers.output.decimalMark+k[1]:"")}}!0===a.escape&&(g=escape(g));"function"===typeof a.onCellData&&(g=a.onCellData(w,e,f,g))}return g}function ma(b,a,f){return a+"-"+f.toLowerCase()}function N(b,a){var e=/^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/.exec(b),g=a;e&&(g=[parseInt(e[1]),parseInt(e[2]),parseInt(e[3])]);return g}function fa(b){var a=
E(b,"text-align"),f=E(b,"font-weight"),g=E(b,"font-style"),d="";"start"==a&&(a="rtl"==E(b,"direction")?"right":"left");700<=f&&(d="bold");"italic"==g&&(d+=g);""===d&&(d="normal");a={style:{align:a,bcolor:N(E(b,"background-color"),[255,255,255]),color:N(E(b,"color"),[0,0,0]),fstyle:d},colspan:parseInt(c(b).attr("colspan"))||0,rowspan:parseInt(c(b).attr("rowspan"))||0};null!==b&&(b=b.getBoundingClientRect(),a.rect={width:b.width,height:b.height});return a}function E(b,a){try{return window.getComputedStyle?
(a=a.replace(/([a-z])([A-Z])/,ma),window.getComputedStyle(b,null).getPropertyValue(a)):b.currentStyle?b.currentStyle[a]:b.style[a]}catch(f){}return""}function O(b,a,f){a=E(b,a).match(/\d+/);if(null!==a){a=a[0];b=b.parentElement;var e=document.createElement("div");e.style.overflow="hidden";e.style.visibility="hidden";b.appendChild(e);e.style.width=100+f;f=100/e.offsetWidth;b.removeChild(e);return a*f}return 0}function T(){if(!(this instanceof T))return new T;this.SheetNames=[];this.Sheets={}}function na(a){for(var b=
new ArrayBuffer(a.length),f=new Uint8Array(b),g=0;g!=a.length;++g)f[g]=a.charCodeAt(g)&255;return b}function oa(a){for(var b={},f={s:{c:1E7,r:1E7},e:{c:0,r:0}},g=0;g!=a.length;++g)for(var c=0;c!=a[g].length;++c){f.s.r>g&&(f.s.r=g);f.s.c>c&&(f.s.c=c);f.e.r<g&&(f.e.r=g);f.e.c<c&&(f.e.c=c);var d={v:a[g][c]};if(null!==d.v){var n=XLSX.utils.encode_cell({c:c,r:g});if("number"===typeof d.v)d.t="n";else if("boolean"===typeof d.v)d.t="b";else if(d.v instanceof Date){d.t="n";d.z=XLSX.SSF._table[14];var m=d,
h;h=(Date.parse(d.v)-new Date(Date.UTC(1899,11,30)))/864E5;m.v=h}else d.t="s";b[n]=d}}1E7>f.s.c&&(b["!ref"]=XLSX.utils.encode_range(f));return b}function ca(a){var b=0,c,g,d;if(0===a.length)return b;c=0;for(d=a.length;c<d;c++)g=a.charCodeAt(c),b=(b<<5)-b+g,b|=0;return b}function C(a,e,c){var b=window.navigator.userAgent;if(!1!==a&&(0<b.indexOf("MSIE ")||b.match(/Trident.*rv\:11\./)))if(window.navigator.msSaveOrOpenBlob)window.navigator.msSaveOrOpenBlob(new Blob([c]),a);else{if(e=document.createElement("iframe"))document.body.appendChild(e),
e.setAttribute("style","display:none"),e.contentDocument.open("txt/html","replace"),e.contentDocument.write(c),e.contentDocument.close(),e.focus(),e.contentDocument.execCommand("SaveAs",!0,a),document.body.removeChild(e)}else if(b=document.createElement("a")){var f=null;b.style.display="none";!1!==a?b.download=a:b.target="_blank";"object"==typeof c?(f=window.URL.createObjectURL(c),b.href=f):0<=e.toLowerCase().indexOf("base64,")?b.href=e+F(c):b.href=e+encodeURIComponent(c);document.body.appendChild(b);
if(document.createEvent)null===Q&&(Q=document.createEvent("MouseEvents")),Q.initEvent("click",!0,!1),b.dispatchEvent(Q);else if(document.createEventObject)b.fireEvent("onclick");else if("function"==typeof b.onclick)b.onclick();f&&window.URL.revokeObjectURL(f);document.body.removeChild(b)}}function F(a){var b="",c,g,d,h,n,m,k=0;a=a.replace(/\x0d\x0a/g,"\n");g="";for(d=0;d<a.length;d++)h=a.charCodeAt(d),128>h?g+=String.fromCharCode(h):(127<h&&2048>h?g+=String.fromCharCode(h>>6|192):(g+=String.fromCharCode(h>>
12|224),g+=String.fromCharCode(h>>6&63|128)),g+=String.fromCharCode(h&63|128));for(a=g;k<a.length;)c=a.charCodeAt(k++),g=a.charCodeAt(k++),d=a.charCodeAt(k++),h=c>>2,c=(c&3)<<4|g>>4,n=(g&15)<<2|d>>6,m=d&63,isNaN(g)?n=m=64:isNaN(d)&&(m=64),b=b+"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(h)+"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(c)+"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(n)+"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(m);
return b}var a={consoleLog:!1,csvEnclosure:'"',csvSeparator:",",csvUseBOM:!0,displayTableName:!1,escape:!1,excelstyles:[],fileName:"tableExport",htmlContent:!1,ignoreColumn:[],ignoreRow:[],jsonScope:"all",jspdf:{orientation:"p",unit:"pt",format:"a4",margins:{left:20,right:10,top:10,bottom:10},autotable:{styles:{cellPadding:2,rowHeight:12,fontSize:8,fillColor:255,textColor:50,fontStyle:"normal",overflow:"ellipsize",halign:"left",valign:"middle"},headerStyles:{fillColor:[52,73,94],textColor:255,fontStyle:"bold",
halign:"center"},alternateRowStyles:{fillColor:245},tableExport:{onAfterAutotable:null,onBeforeAutotable:null,onAutotableText:null,onTable:null,outputImages:!0}}},numbers:{html:{decimalMark:".",thousandsSeparator:","},output:{decimalMark:".",thousandsSeparator:","}},onCellData:null,onCellHtmlData:null,outputMode:"file",pdfmake:{enabled:!1},tbodySelector:"tr",tfootSelector:"tr",theadSelector:"tr",tableName:"myTableName",type:"csv",worksheetName:"xlsWorksheetName"},r=this,Q=null,p=[],h=[],k=0,A=[],
l="",H=[],y;c.extend(!0,a,t);H=S(r);if("csv"==a.type||"tsv"==a.type||"txt"==a.type){var D="",I=0,k=0,U=function(b,e,f){b.each(function(){l="";z(this,e,k,f+b.length,function(b,c,e){var f=l,d="";if(null!==b)if(b=x(b,c,e),c=null===b||""===b?"":b.toString(),"tsv"==a.type)b instanceof Date&&b.toLocaleString(),d=P(c,"\t"," ");else if(b instanceof Date)d=a.csvEnclosure+b.toLocaleString()+a.csvEnclosure;else if(d=P(c,a.csvEnclosure,a.csvEnclosure+a.csvEnclosure),0<=d.indexOf(a.csvSeparator)||/[\r\n ]/g.test(d))d=
a.csvEnclosure+d+a.csvEnclosure;l=f+(d+("tsv"==a.type?"\t":a.csvSeparator))});l=c.trim(l).substring(0,l.length-1);0<l.length&&(0<D.length&&(D+="\n"),D+=l);k++});return b.length},I=I+U(c(r).find("thead").first().find(a.theadSelector),"th,td",I);c(r).find("tbody").each(function(){I+=U(c(this).find(a.tbodySelector),"td,th",I)});a.tfootSelector.length&&U(c(r).find("tfoot").first().find(a.tfootSelector),"td,th",I);D+="\n";!0===a.consoleLog&&console.log(D);if("string"===a.outputMode)return D;if("base64"===
a.outputMode)return F(D);if("window"===a.outputMode){C(!1,"data:text/"+("csv"==a.type?"csv":"plain")+";charset=utf-8,",D);return}try{y=new Blob([D],{type:"text/"+("csv"==a.type?"csv":"plain")+";charset=utf-8"}),saveAs(y,a.fileName+"."+a.type,"csv"!=a.type||!1===a.csvUseBOM)}catch(b){C(a.fileName+"."+a.type,"data:text/"+("csv"==a.type?"csv":"plain")+";charset=utf-8,"+("csv"==a.type&&a.csvUseBOM?"\ufeff":""),D)}}else if("sql"==a.type){var k=0,u="INSERT INTO `"+a.tableName+"` (",p=c(r).find("thead").first().find(a.theadSelector);
p.each(function(){z(this,"th,td",k,p.length,function(a,c,f){u+="'"+x(a,c,f)+"',"});k++;u=c.trim(u);u=c.trim(u).substring(0,u.length-1)});u+=") VALUES ";c(r).find("tbody").each(function(){h.push.apply(h,c(this).find(a.tbodySelector))});a.tfootSelector.length&&h.push.apply(h,c(r).find("tfoot").find(a.tfootSelector));c(h).each(function(){l="";z(this,"td,th",k,p.length+h.length,function(a,c,f){l+="'"+x(a,c,f)+"',"});3<l.length&&(u+="("+l,u=c.trim(u).substring(0,u.length-1),u+="),");k++});u=c.trim(u).substring(0,
u.length-1);u+=";";!0===a.consoleLog&&console.log(u);if("string"===a.outputMode)return u;if("base64"===a.outputMode)return F(u);try{y=new Blob([u],{type:"text/plain;charset=utf-8"}),saveAs(y,a.fileName+".sql")}catch(b){C(a.fileName+".sql","data:application/sql;charset=utf-8,",u)}}else if("json"==a.type){var J=[],p=c(r).find("thead").first().find(a.theadSelector);p.each(function(){var a=[];z(this,"th,td",k,p.length,function(b,c,d){a.push(x(b,c,d))});J.push(a)});var V=[];c(r).find("tbody").each(function(){h.push.apply(h,
c(this).find(a.tbodySelector))});a.tfootSelector.length&&h.push.apply(h,c(r).find("tfoot").find(a.tfootSelector));c(h).each(function(){var a={},e=0;z(this,"td,th",k,p.length+h.length,function(b,c,d){J.length?a[J[J.length-1][e]]=x(b,c,d):a[e]=x(b,c,d);e++});!1===c.isEmptyObject(a)&&V.push(a);k++});t="";t="head"==a.jsonScope?JSON.stringify(J):"data"==a.jsonScope?JSON.stringify(V):JSON.stringify({header:J,data:V});!0===a.consoleLog&&console.log(t);if("string"===a.outputMode)return t;if("base64"===a.outputMode)return F(t);
try{y=new Blob([t],{type:"application/json;charset=utf-8"}),saveAs(y,a.fileName+".json")}catch(b){C(a.fileName+".json","data:application/json;charset=utf-8;base64,",t)}}else if("xml"===a.type){var k=0,B='<?xml version="1.0" encoding="utf-8"?>',B=B+"<tabledata><fields>",p=c(r).find("thead").first().find(a.theadSelector);p.each(function(){z(this,"th,td",k,p.length,function(a,c,d){B+="<field>"+x(a,c,d)+"</field>"});k++});var B=B+"</fields><data>",ga=1;c(r).find("tbody").each(function(){h.push.apply(h,
c(this).find(a.tbodySelector))});a.tfootSelector.length&&h.push.apply(h,c(r).find("tfoot").find(a.tfootSelector));c(h).each(function(){var a=1;l="";z(this,"td,th",k,p.length+h.length,function(b,c,d){l+="<column-"+a+">"+x(b,c,d)+"</column-"+a+">";a++});0<l.length&&"<column-1></column-1>"!=l&&(B+='<row id="'+ga+'">'+l+"</row>",ga++);k++});B+="</data></tabledata>";!0===a.consoleLog&&console.log(B);if("string"===a.outputMode)return B;if("base64"===a.outputMode)return F(B);try{y=new Blob([B],{type:"application/xml;charset=utf-8"}),
saveAs(y,a.fileName+".xml")}catch(b){C(a.fileName+".xml","data:application/xml;charset=utf-8;base64,",B)}}else if("excel"==a.type||"xls"==a.type||"word"==a.type||"doc"==a.type){t="excel"==a.type||"xls"==a.type?"excel":"word";var K="excel"==t?"xls":"doc",q='xmlns:x="urn:schemas-microsoft-com:office:'+t+'"',G="";c(r).filter(function(){return"none"!=c(this).data("tableexport-display")&&(c(this).is(":visible")||"always"==c(this).data("tableexport-display"))}).each(function(){var b=c(this);k=0;H=S(this);
G+="<table><thead>";p=b.find("thead").first().find(a.theadSelector);p.each(function(){l="";z(this,"th,td",k,p.length,function(b,d,g){if(null!==b){var e="";l+="<th";for(var f in a.excelstyles)if(a.excelstyles.hasOwnProperty(f)){var n=c(b).css(a.excelstyles[f]);""!==n&&"0px none rgb(0, 0, 0)"!=n&&"rgba(0, 0, 0, 0)"!=n&&(e+=""===e?'style="':";",e+=a.excelstyles[f]+":"+n)}""!==e&&(l+=" "+e+'"');c(b).is("[colspan]")&&(l+=' colspan="'+c(b).attr("colspan")+'"');c(b).is("[rowspan]")&&(l+=' rowspan="'+c(b).attr("rowspan")+
'"');l+=">"+x(b,d,g)+"</th>"}});0<l.length&&(G+="<tr>"+l+"</tr>");k++});G+="</thead><tbody>";b.find("tbody").each(function(){h.push.apply(h,c(this).find(a.tbodySelector))});a.tfootSelector.length&&h.push.apply(h,b.find("tfoot").find(a.tfootSelector));c(h).each(function(){var b=c(this);l="";z(this,"td,th",k,p.length+h.length,function(e,d,h){if(null!==e){var f="",g=c(e).data("tableexport-msonumberformat");"undefined"==typeof g&&"function"===typeof a.onMsoNumberFormat&&(g=a.onMsoNumberFormat(e,d,h));
"undefined"!=typeof g&&""!==g&&(f="style=\"mso-number-format:'"+g+"'");for(var m in a.excelstyles)a.excelstyles.hasOwnProperty(m)&&(g=c(e).css(a.excelstyles[m]),""===g&&(g=b.css(a.excelstyles[m])),""!==g&&"0px none rgb(0, 0, 0)"!=g&&"rgba(0, 0, 0, 0)"!=g&&(f+=""===f?'style="':";",f+=a.excelstyles[m]+":"+g));l+="<td";""!==f&&(l+=" "+f+'"');c(e).is("[colspan]")&&(l+=' colspan="'+c(e).attr("colspan")+'"');c(e).is("[rowspan]")&&(l+=' rowspan="'+c(e).attr("rowspan")+'"');l+=">"+x(e,d,h).replace(/\n/g,
"<br>")+"</td>"}});0<l.length&&(G+="<tr>"+l+"</tr>");k++});a.displayTableName&&(G+="<tr><td></td></tr><tr><td></td></tr><tr><td>"+x(c("<p>"+a.tableName+"</p>"))+"</td></tr>");G+="</tbody></table>";!0===a.consoleLog&&console.log(G)});q='<html xmlns:o="urn:schemas-microsoft-com:office:office" '+q+' xmlns="http://www.w3.org/TR/REC-html40">'+('<meta http-equiv="content-type" content="application/vnd.ms-'+t+'; charset=UTF-8">')+"<head>";"excel"===t&&(q+="\x3c!--[if gte mso 9]>",q+="<xml>",q+="<x:ExcelWorkbook>",
q+="<x:ExcelWorksheets>",q+="<x:ExcelWorksheet>",q+="<x:Name>",q+=a.worksheetName,q+="</x:Name>",q+="<x:WorksheetOptions>",q+="<x:DisplayGridlines/>",q+="</x:WorksheetOptions>",q+="</x:ExcelWorksheet>",q+="</x:ExcelWorksheets>",q+="</x:ExcelWorkbook>",q+="</xml>",q+="<![endif]--\x3e");q+="<style>br {mso-data-placement:same-cell;}</style>";q+="</head>";q+="<body>";q+=G;q+="</body>";q+="</html>";!0===a.consoleLog&&console.log(q);if("string"===a.outputMode)return q;if("base64"===a.outputMode)return F(q);
try{y=new Blob([q],{type:"application/vnd.ms-"+a.type}),saveAs(y,a.fileName+"."+K)}catch(b){C(a.fileName+"."+K,"data:application/vnd.ms-"+t+";base64,",q)}}else if("xlsx"==a.type){var ha=[],W=[],k=0,h=c(r).find("thead").first().find(a.theadSelector);c(r).find("tbody").each(function(){h.push.apply(h,c(this).find(a.tbodySelector))});a.tfootSelector.length&&h.push.apply(h,c(r).find("tfoot").find(a.tfootSelector));c(h).each(function(){var a=[];z(this,"th,td",k,h.length,function(b,c,d){if("undefined"!==
typeof b&&null!==b){var e=parseInt(b.getAttribute("colspan")),f=parseInt(b.getAttribute("rowspan"));b=x(b,c,d);""!==b&&b==+b&&(b=+b);W.forEach(function(b){if(k>=b.s.r&&k<=b.e.r&&a.length>=b.s.c&&a.length<=b.e.c)for(var c=0;c<=b.e.c-b.s.c;++c)a.push(null)});if(f||e)e=e||1,W.push({s:{r:k,c:a.length},e:{r:k+(f||1)-1,c:a.length+e-1}});a.push(""!==b?b:null);if(e)for(f=0;f<e-1;++f)a.push(null)}});ha.push(a);k++});t=new T;K=oa(ha);K["!merges"]=W;t.SheetNames.push(a.worksheetName);t.Sheets[a.worksheetName]=
K;t=XLSX.write(t,{bookType:a.type,bookSST:!1,type:"binary"});try{y=new Blob([na(t)],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"}),saveAs(y,a.fileName+"."+a.type)}catch(b){C(a.fileName+"."+a.type,"data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8,",y)}}else if("png"==a.type)html2canvas(c(r)[0]).then(function(b){b=b.toDataURL();for(var c=atob(b.substring(22)),d=new ArrayBuffer(c.length),g=new Uint8Array(d),h=0;h<c.length;h++)g[h]=
c.charCodeAt(h);!0===a.consoleLog&&console.log(c);if("string"===a.outputMode)return c;if("base64"===a.outputMode)return F(b);if("window"===a.outputMode)window.open(b);else try{y=new Blob([d],{type:"image/png"}),saveAs(y,a.fileName+".png")}catch(v){C(a.fileName+".png","data:image/png,",y)}});else if("pdf"==a.type)if(!0===a.pdfmake.enabled){var X=[],Y=[],k=0,p=c(this).find("thead").first().find(a.theadSelector);p.each(function(){var a=[];z(this,"th,td",k,p.length,function(b,c,d){a.push(x(b,c,d))});
a.length&&Y.push(a);for(var c=X.length;c<a.length;c++)X.push("*");k++});c(this).find("tbody").each(function(){h.push.apply(h,c(this).find(a.tbodySelector))});a.tfootSelector.length&&h.push.apply(h,c(this).find("tfoot").find(a.tfootSelector));c(h).each(function(){var a=[];z(this,"td,th",k,p.length+h.length,function(b,c,d){a.push(x(b,c,d))});a.length&&Y.push(a);k++});pdfMake.createPdf({pageOrientation:"landscape",content:[{table:{headerRows:p.length,widths:X,body:Y}}]}).getBuffer(function(b){try{var c=
new Blob([b],{type:"application/pdf"});saveAs(c,a.fileName+".pdf")}catch(f){C(a.fileName+".pdf","data:application/pdf;base64,",b)}})}else if(!1===a.jspdf.autotable){t={dim:{w:O(c(r).first().get(0),"width","mm"),h:O(c(r).first().get(0),"height","mm")},pagesplit:!1};var ia=new jsPDF(a.jspdf.orientation,a.jspdf.unit,a.jspdf.format);ia.addHTML(c(r).first(),a.jspdf.margins.left,a.jspdf.margins.top,t,function(){Z(ia,!1)})}else{var d=a.jspdf.autotable.tableExport;if("string"===typeof a.jspdf.format&&"bestfit"===
a.jspdf.format.toLowerCase()){var L={a0:[2383.94,3370.39],a1:[1683.78,2383.94],a2:[1190.55,1683.78],a3:[841.89,1190.55],a4:[595.28,841.89]},R="",M="",ja=0;c(r).filter(":visible").each(function(){if("none"!=c(this).css("display")){var a=O(c(this).get(0),"width","pt");if(a>ja){a>L.a0[0]&&(R="a0",M="l");for(var d in L)L.hasOwnProperty(d)&&L[d][1]>a&&(R=d,M="l",L[d][0]>a&&(M="p"));ja=a}}});a.jspdf.format=""===R?"a4":R;a.jspdf.orientation=""===M?"w":M}d.doc=new jsPDF(a.jspdf.orientation,a.jspdf.unit,a.jspdf.format);
!0===d.outputImages&&(d.images={});"undefined"!=typeof d.images&&(c(r).filter(function(){return"none"!=c(this).data("tableexport-display")&&(c(this).is(":visible")||"always"==c(this).data("tableexport-display"))}).each(function(){var b=0;p=c(this).find("thead").find(a.theadSelector);c(this).find("tbody").each(function(){h.push.apply(h,c(this).find(a.tbodySelector))});a.tfootSelector.length&&h.push.apply(h,c(this).find("tfoot").find(a.tfootSelector));c(h).each(function(){z(this,"td,th",p.length+b,
p.length+h.length,function(a,b,g){"undefined"!==typeof a&&null!==a&&(b=c(a).children(),"undefined"!=typeof b&&0<b.length&&ba(a,b,d))});b++})}),p=[],h=[]);ka(d,function(b){c(r).filter(function(){return"none"!=c(this).data("tableexport-display")&&(c(this).is(":visible")||"always"==c(this).data("tableexport-display"))}).each(function(){var b,f=0;H=S(this);d.columns=[];d.rows=[];d.rowoptions={};if("function"===typeof d.onTable&&!1===d.onTable(c(this),a))return!0;a.jspdf.autotable.tableExport=null;var g=
c.extend(!0,{},a.jspdf.autotable);a.jspdf.autotable.tableExport=d;g.margin={};c.extend(!0,g.margin,a.jspdf.margins);g.tableExport=d;"function"!==typeof g.beforePageContent&&(g.beforePageContent=function(a){1==a.pageCount&&a.table.rows.concat(a.table.headerRow).forEach(function(b){0<b.height&&(b.height+=(2-1.15)/2*b.styles.fontSize,a.table.height+=(2-1.15)/2*b.styles.fontSize)})});"function"!==typeof g.createdHeaderCell&&(g.createdHeaderCell=function(a,b){a.styles=c.extend({},b.row.styles);if("undefined"!=
typeof d.columns[b.column.dataKey]){var e=d.columns[b.column.dataKey];if("undefined"!=typeof e.rect){var f;a.contentWidth=e.rect.width;if("undefined"==typeof d.heightRatio||0===d.heightRatio)f=b.row.raw[b.column.dataKey].rowspan?b.row.raw[b.column.dataKey].rect.height/b.row.raw[b.column.dataKey].rowspan:b.row.raw[b.column.dataKey].rect.height,d.heightRatio=a.styles.rowHeight/f;f=b.row.raw[b.column.dataKey].rect.height*d.heightRatio;f>a.styles.rowHeight&&(a.styles.rowHeight=f)}"undefined"!=typeof e.style&&
!0!==e.style.hidden&&(a.styles.halign=e.style.align,"inherit"===g.styles.fillColor&&(a.styles.fillColor=e.style.bcolor),"inherit"===g.styles.textColor&&(a.styles.textColor=e.style.color),"inherit"===g.styles.fontStyle&&(a.styles.fontStyle=e.style.fstyle))}});"function"!==typeof g.createdCell&&(g.createdCell=function(a,b){var c=d.rowoptions[b.row.index+":"+b.column.dataKey];"undefined"!=typeof c&&"undefined"!=typeof c.style&&!0!==c.style.hidden&&(a.styles.halign=c.style.align,"inherit"===g.styles.fillColor&&
(a.styles.fillColor=c.style.bcolor),"inherit"===g.styles.textColor&&(a.styles.textColor=c.style.color),"inherit"===g.styles.fontStyle&&(a.styles.fontStyle=c.style.fstyle))});"function"!==typeof g.drawHeaderCell&&(g.drawHeaderCell=function(a,b){var c=d.columns[b.column.dataKey];return(!0!==c.style.hasOwnProperty("hidden")||!0!==c.style.hidden)&&0<=c.rowIndex?aa(a,b,c):!1});"function"!==typeof g.drawCell&&(g.drawCell=function(a,b){var c=d.rowoptions[b.row.index+":"+b.column.dataKey];if(aa(a,b,c))if(d.doc.rect(a.x,
a.y,a.width,a.height,a.styles.fillStyle),"undefined"!=typeof c&&"undefined"!=typeof c.kids&&0<c.kids.length){var e=a.height/c.rect.height;if(e>d.dh||"undefined"==typeof d.dh)d.dh=e;d.dw=a.width/c.rect.width;la(a,c.kids,d);da(a,c.kids,d)}else da(a,{},d);return!1});d.headerrows=[];p=c(this).find("thead").find(a.theadSelector);p.each(function(){b=0;d.headerrows[f]=[];z(this,"th,td",f,p.length,function(a,c,e){var g=fa(a);g.title=x(a,c,e);g.key=b++;g.rowIndex=f;d.headerrows[f].push(g)});f++});if(0<f)for(var k=
f-1;0<=k;)c.each(d.headerrows[k],function(){var a=this;0<k&&null===this.rect&&(a=d.headerrows[k-1][this.key]);null!==a&&0<=a.rowIndex&&(!0!==a.style.hasOwnProperty("hidden")||!0!==a.style.hidden)&&d.columns.push(a)}),k=0<d.columns.length?-1:k-1;var l=0;h=[];c(this).find("tbody").each(function(){h.push.apply(h,c(this).find(a.tbodySelector))});a.tfootSelector.length&&h.push.apply(h,c(this).find("tfoot").find(a.tfootSelector));c(h).each(function(){var a=[];b=0;z(this,"td,th",f,p.length+h.length,function(e,
f,g){if("undefined"===typeof d.columns[b]){var h={title:"",key:b,style:{hidden:!0}};d.columns.push(h)}"undefined"!==typeof e&&null!==e?(h=fa(e),h.kids=c(e).children()):(h=c.extend(!0,{},d.rowoptions[l+":"+(b-1)]),h.colspan=-1);d.rowoptions[l+":"+b++]=h;a.push(x(e,f,g))});a.length&&(d.rows.push(a),l++);f++});if("function"===typeof d.onBeforeAutotable)d.onBeforeAutotable(c(this),d.columns,d.rows,g);d.doc.autoTable(d.columns,d.rows,g);if("function"===typeof d.onAfterAutotable)d.onAfterAutotable(c(this),
g);a.jspdf.autotable.startY=d.doc.autoTableEndPosY()+g.margin.top});Z(d.doc,"undefined"!=typeof d.images&&!1===jQuery.isEmptyObject(d.images));"undefined"!=typeof d.headerrows&&(d.headerrows.length=0);"undefined"!=typeof d.columns&&(d.columns.length=0);"undefined"!=typeof d.rows&&(d.rows.length=0);delete d.doc;d.doc=null})}return this}})})(jQuery);
