import {assign, forEach} from 'min-dash';

import inherits from 'inherits';

import {is} from '../../../common/util/ModelUtil';

import BaseElementFactory from 'diagram-js/lib/core/ElementFactory';

import {DEFAULT_LABEL_SIZE} from '../../util/LabelUtil';


/**
 * A od-aware factory for diagram-js shapes
 */
export default function ElementFactory(odFactory, moddle, translate) {
    BaseElementFactory.call(this);

    this._odFactory = odFactory;
    this._moddle = moddle;
    this._translate = translate;
}

inherits(ElementFactory, BaseElementFactory);

ElementFactory.$inject = [
    'odFactory',
    'moddle',
    'translate'
];

ElementFactory.prototype.baseCreate = BaseElementFactory.prototype.create;

ElementFactory.prototype.create = function (elementType, attrs) {

    // no special magic for labels,
    // we assume their businessObjects have already been created
    // and wired via attrs
    if (elementType === 'label') {
        return this.baseCreate(elementType, assign({type: 'label'}, DEFAULT_LABEL_SIZE, attrs));
    }

    return this.createOdElement(elementType, attrs);
};

ElementFactory.prototype.createBusinessObject = function (type, attrs) {
    const element = this._moddle.create(type, attrs || {});
    this._odFactory._ensureId(element);
    return element;
};

ElementFactory.prototype.createRootBoard = function (name, objective) {
    var rootBoard = this.createBusinessObject('odDi:OdRootBoard', {name: name, objectiveRef: objective});
    var board = this.createBusinessObject('rem:OdBoard');
    rootBoard.plane = this.createBusinessObject('odDi:OdPlane', {boardElement: board});
    return [rootBoard, board];
};


ElementFactory.prototype.createOdElement = function (elementType, attrs) {
    var size,
        translate = this._translate;

    attrs = attrs || {};

    var businessObject = attrs.businessObject;

    if (!businessObject) {
        if (!attrs.type) {
            throw new Error(translate('no shape type specified'));
        }

        businessObject = this._odFactory.create(attrs.type, attrs);
    }

    if (!businessObject.di) {
        if (elementType === 'root') {
            businessObject.di = this._odFactory.createDiPlane(businessObject, [], {
                id: businessObject.id + '_di'
            });
        } else if (elementType === 'connection') {
            businessObject.di = this._odFactory.createDiEdge(businessObject, [], {
                id: businessObject.id + '_di'
            });
        } else {
            businessObject.di = this._odFactory.createDiShape(businessObject, {}, {
                id: businessObject.id + '_di'
            });
        }
    }

    if (attrs.di) {
        assign(businessObject.di, attrs.di);

        delete attrs.di;
    }

    applyAttributes(businessObject, attrs, [
        'processRef',
        'isInterrupting',
        'associationDirection',
        'isForCompensation'
    ]);

    size = this._getDefaultSize(businessObject);

    attrs = assign({
        businessObject: businessObject,
        id: businessObject.id
    }, size, attrs);

    return this.baseCreate(elementType, attrs);
};


ElementFactory.prototype._getDefaultSize = function (semantic) {
    if (is(semantic, 'rem:Resource')) {
        return {width: 150, height: 90};
    }
    return {width: 100, height: 80};
};


// helpers //////////////////////

/**
 * Apply attributes from a map to the given element,
 * remove attribute from the map on application.
 *
 * @param {Base} element
 * @param {Object} attrs (in/out map of attributes)
 * @param {Array<String>} attributeNames name of attributes to apply
 */
function applyAttributes(element, attrs, attributeNames) {

    forEach(attributeNames, function (property) {
        if (attrs[property] !== undefined) {
            applyAttribute(element, attrs, property);
        }
    });
}

/**
 * Apply named property to element and drain it from the attrs
 * collection.
 *
 * @param {Base} element
 * @param {Object} attrs (in/out map of attributes)
 * @param {String} attributeName to apply
 */
function applyAttribute(element, attrs, attributeName) {
    element[attributeName] = attrs[attributeName];

    delete attrs[attributeName];
}