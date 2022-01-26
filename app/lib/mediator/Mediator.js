import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';
import inherits from 'inherits';
import { is } from '../datamodelmodeler/util/ModelUtil';
import OlcEvents from '../olcmodeler/OlcEvents';
import FragmentEvents from '../fragmentmodeler/FragmentEvents';
import { meaningful_state_lables } from '../guidelines/olc_guidelines/olc_checking';

export default function Mediator() {
    [this.OlcModelerHook, this.DataModelerHook, this.FragmentModelerHook, this.GoalStateModelerHook].forEach(hook => {
        hook.mediator = this
    });
}

Mediator.prototype.addedClass = function (clazz) {
    this.olcModelerHook.olcModeler.addOlc(clazz);
}

Mediator.prototype.confirmClassDeletion = function (clazz) {
    var affectedLiterals = this.goalStateModelerHook.goalStateModeler.getLiteralsWithClassId(clazz.id);
    var affectedStates = this.olcModelerHook.olcModeler.getOlcById(clazz.id).get('Elements').filter(element => is(element, 'olc:State'));
    return confirm('Do you really want to delete class \"' + clazz.name + '\" ?'
        + '\n' + affectedLiterals.length + ' literal(s) and ' + affectedStates.length + ' olc state(s) would be deleted as well.');
}

Mediator.prototype.deletedClass = function (clazz) {
    this.olcModelerHook.olcModeler.deleteOlc(clazz.id);
    this.fragmentModelerHook.fragmentModeler.handleClassDeleted(clazz);
}

Mediator.prototype.renamedClass = function (clazz) {
    this.olcModelerHook.olcModeler.renameOlc(clazz.name, clazz.id);
    this.fragmentModelerHook.fragmentModeler.handleClassRenamed(clazz);
}

Mediator.prototype.addedState = function (olcState) {
    var clazz = olcState.$parent;
    console.log('added state named \"', olcState.name, '\" with id \"', olcState.id, '\" to class named \"', clazz.name, '\" with id \"', clazz.id, "\"");
    
    // check for meaningful label?
    meaningful_state_lables(olcState);
}

Mediator.prototype.deletedState = function (olcState) {
    var clazz = olcState.$parent;
    console.log('removed state named \"', olcState.name, '\" with id \"', olcState.id, '\" from class named \"', clazz.name, '\" with id \"', clazz.id, "\"");
    this.goalStateModelerHook.goalStateModeler.handleStateDeleted(olcState);
    this.fragmentModelerHook.fragmentModeler.handleStateDeleted(olcState);
}

Mediator.prototype.renamedState = function (olcState) {
    this.goalStateModelerHook.goalStateModeler.handleStateRenamed(olcState);
    this.fragmentModelerHook.fragmentModeler.handleStateRenamed(olcState);
     // check for meaningful label?
    meaningful_state_lables(olcState);
}

Mediator.prototype.olcListChanged = function (olcs) {
    this.goalStateModelerHook.goalStateModeler.handleOlcListChanged(olcs);
    this.fragmentModelerHook.fragmentModeler.handleOlcListChanged(olcs);
}

Mediator.prototype.olcRenamed = function (olc, name) {
    this.dataModelerHook.dataModeler.renameClass(olc.classRef, name);
}

Mediator.prototype.createState = function (name, olc) {
    return this.olcModelerHook.olcModeler.createState(name, olc);
}

Mediator.prototype.createDataclass = function (name) {
    return this.dataModelerHook.dataModeler.createDataclass(name);
}

// === Olc Modeler Hook
Mediator.prototype.OlcModelerHook = function (eventBus, olcModeler) {
    CommandInterceptor.call(this, eventBus);
    this.mediator = this.__proto__.constructor.mediator;
    this.mediator.olcModelerHook = this;
    this._eventBus = eventBus;
    this.olcModeler = olcModeler;

    this.executed([
        'shape.create'
    ], event => {
        if (is(event.context.shape, 'olc:State')) {
            this.mediator.addedState(event.context.shape.businessObject);
        }
    });
    this.executed([
        'shape.delete'
    ], event => {
        if (is(event.context.shape, 'olc:State')) {
            this.mediator.deletedState(event.context.shape.businessObject);
        }
    });

    this.executed([
        'element.updateLabel'
    ], event => {
        if (is(event.context.element, 'olc:State')) {
            this.mediator.renamedState(event.context.element.businessObject);
        }
    });

    this.reverted([
        'element.updateLabel'
    ], event => {
        if (is(event.context.element, 'olc:State')) {
            this.mediator.renamedState(event.context.element.businessObject);
        }
    });

    eventBus.on(OlcEvents.DEFINITIONS_CHANGED, event => {
        this.mediator.olcListChanged(event.definitions.olcs);
    });

    eventBus.on(OlcEvents.OLC_RENAME, event => {
        this.mediator.olcRenamed(event.olc, event.name);
    });
}
inherits(Mediator.prototype.OlcModelerHook, CommandInterceptor);

Mediator.prototype.OlcModelerHook.$inject = [
    'eventBus',
    'olcModeler'
];

// === Data Modeler Hook
Mediator.prototype.DataModelerHook = function (eventBus, dataModeler) {
    CommandInterceptor.call(this, eventBus);
    this.mediator = this.__proto__.constructor.mediator;
    this.mediator.dataModelerHook = this;
    this._eventBus = eventBus;
    this.dataModeler = dataModeler;

    this.executed([
        'shape.create'
    ], event => {
        if (is(event.context.shape, 'od:Class')) {
            this.mediator.addedClass(event.context.shape.businessObject);
        }
    });

    this.reverted([
        'shape.create'
    ], event => {
        if (is(event.context.shape, 'od:Class')) {
            console.log(event);
            //this.mediator.addedState(event.context.shape.businessObject);
        }
    });

    this.executed([
        'shape.delete'
    ], event => {
        if (is(event.context.shape, 'od:Class')) {
            this.mediator.deletedClass(event.context.shape.businessObject);
        }
    });

    this.reverted([
        'shape.delete'
    ], event => {
        if (is(event.context.shape, 'od:Class')) {
            console.log(event);
            //this.mediator.deletedState(event.context.shape.businessObject);
        }
    });

    this.preExecute([
        'elements.delete'
    ], event => {
        event.context.elements = event.context.elements.filter(element => {
            if (is(element, 'od:Class')) {
                return this.mediator.confirmClassDeletion(element.businessObject);
            } else {
                return true;
            }
        });
    });


    this.executed([
        'element.updateLabel'
    ], event => {
        var changedLabel = event.context.element.businessObject.labelAttribute;
        if (is(event.context.element, 'od:Class') && (changedLabel === 'name' || !changedLabel)) {
            this.mediator.renamedClass(event.context.element.businessObject);
        }
    });

    this.reverted([
        'element.updateLabel'
    ], event => {
        var changedLabel = event.context.element.businessObject.labelAttribute;
        if (is(event.context.element, 'od:Class') && (changedLabel === 'name' || !changedLabel)) {
            this.mediator.renamedClass(event.context.element.businessObject);
        }
    });
}
inherits(Mediator.prototype.DataModelerHook, CommandInterceptor);

Mediator.prototype.DataModelerHook.$inject = [
    'eventBus',
    'dataModeler'
];

// === Fragment Modeler Hook
Mediator.prototype.FragmentModelerHook = function (eventBus, fragmentModeler) {
    CommandInterceptor.call(this, eventBus);
    this.mediator = this.__proto__.constructor.mediator;
    this.mediator.fragmentModelerHook = this;
    this._eventBus = eventBus;
    this.fragmentModeler = fragmentModeler;

    eventBus.on(FragmentEvents.CREATED_STATE, event => {
        return this.mediator.createState(event.name, event.olc);
    });

    eventBus.on(FragmentEvents.CREATED_DATACLASS, event => {
        return this.mediator.createDataclass(event.name);
    });
}
inherits(Mediator.prototype.FragmentModelerHook, CommandInterceptor);

Mediator.prototype.FragmentModelerHook.$inject = [
    'eventBus',
    'fragmentModeler'
];

// === Goal State Modeler Hook
Mediator.prototype.GoalStateModelerHook = function (goalStateModeler) {
    this.mediator = this.__proto__.constructor.mediator;
    this.goalStateModeler = goalStateModeler;
    this.mediator.goalStateModelerHook = this;
}