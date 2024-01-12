import CommandInterceptor from "diagram-js/lib/command/CommandInterceptor";
import getDropdown from "../../util/Dropdown";
import { appendOverlayListeners } from "../../util/HtmlUtil";
import { is } from "../../util/Util";

export default class ResourceLabelHandler extends CommandInterceptor {
  constructor(eventBus, modeling, directEditing, overlays, resourceModeler) {
    super(eventBus);
    this._eventBus = eventBus;
    this._modeling = modeling;
    this._dropdownContainer = document.createElement("div");
    this._dropdownContainer2 = document.createElement("div");
    this._dropdownContainer.classList.add("dd-dropdown-multicontainer");
    this._dropdownContainer2.classList.add("dd-dropdown-multicontainer");
    this._roleDropdown = getDropdown("Role/Position");
    this._dropdownContainer.appendChild(this._roleDropdown);
    this._unitDropdown = getDropdown("Organizational Unit");
    this._dropdownContainer2.appendChild(this._unitDropdown);
    this._currentDropdownTarget = undefined;
    this._overlayId = undefined;
    this._overlays = overlays;
    this._resourceModeler = resourceModeler;

    eventBus.on("directEditing.activate", function (e) {
      if (is(e.active.element, "rem:Position")) {
        directEditing.cancel();
      }
    });

    eventBus.on(["element.dblclick", "create.end", "autoPlace.end"], (e) => {
      const element = e.element || e.shape || e.elements[0];
      if (is(element, "rem:Position")) {
        const resource = element.businessObject;
        this._dropdownContainer.currentElement = element;

        const updateRolesSelection = () => {
          this._rolesDropdown
            .getEntries()
            .forEach((entry) =>
              entry.setSelected(
                resource.roles?.find((role) => role === entry.option)
              )
            );
        };

        const populateNameDropdown = () => {
          this._roleDropdown.populate([], () => {}, element);
          this._roleDropdown.addCreateElementInput(
            (event) => this._dropdownContainer.confirm(),
            "text",
            resource.name
          );
        };

        populateNameDropdown();

        this._dropdownContainer.confirm = (event) => {
          const newNameInput = this._roleDropdown.getInputValue().trim();

          if (newNameInput !== "" && newNameInput !== resource.name) {
            this.updateName(newNameInput, element);
            populateNameDropdown();
          }
        };

        let shouldBlockNextClick = e.type === "create.end";
        this._dropdownContainer.handleClick = (event) => {
          if (shouldBlockNextClick) {
            shouldBlockNextClick = false;
            return true;
          } else if (!this._dropdownContainer.contains(event.target)) {
            return false;
          } else if (event.target.classList.contains("dd-dropdown-entry")) {
            this._rolesDropdown.clearInput();
          } else if (event.target.tagName !== "INPUT" || !event.target.value) {
            this._dropdownContainer.confirm();
          }
          return true;
        };

        this._dropdownContainer.close = () => {
          if (this._overlayId) {
            this._overlays.remove(this._overlayId);
            this._overlayId = undefined;
          }
          this._dropdownContainer.currentElement = undefined;
          this._currentDropdownTarget = undefined;
        };

        const closeOverlay = appendOverlayListeners(this._dropdownContainer);
        eventBus.once("element.contextmenu", (event) => {
          if (
            this._currentDropdownTarget &&
            (event.element || event.shape).businessObject !==
              this._currentDropdownTarget
          ) {
            closeOverlay(event);
            event.preventDefault();
          }
        });

        // Show the menu(e)
        this._overlayId = overlays.add(element.id, "classSelection", {
          position: {
            bottom: 0,
            right: 0,
          },
          scale: false,
          html: this._dropdownContainer,
        });

        this._currentDropdownTarget = element.businessObject;
      }
      if (is(element, "rem:OrganizationalUnit")) {
        const resource = element.businessObject;
        this._dropdownContainer2.currentElement = element;

        const updateRolesSelection = () => {
          this._rolesDropdown
            .getEntries()
            .forEach((entry) =>
              entry.setSelected(
                resource.roles?.find((role) => role === entry.option)
              )
            );
        };

        const populateUnitDropdown = () => {
          this._unitDropdown.populate([], () => {}, element);
          this._unitDropdown.addCreateElementInput(
            (event) => this._dropdownContainer2.confirm(),
            "text",
            resource.name
          );
        };

        populateUnitDropdown();

        this._dropdownContainer2.confirm = (event) => {
          const newNameInput = this._unitDropdown.getInputValue().trim();

          if (newNameInput !== "" && newNameInput !== resource.name) {
            this.updateName(newNameInput, element);
            populateUnitDropdown();
          }
        };

        let shouldBlockNextClick = e.type === "create.end";
        this._dropdownContainer2.handleClick = (event) => {
          if (shouldBlockNextClick) {
            shouldBlockNextClick = false;
            return true;
          } else if (!this._dropdownContainer2.contains(event.target)) {
            return false;
          } else if (event.target.classList.contains("dd-dropdown-entry")) {
            this._unitDropdown.clearInput();
          } else if (event.target.tagName !== "INPUT" || !event.target.value) {
            this._dropdownContainer2.confirm();
          }
          return true;
        };

        this._dropdownContainer2.close = () => {
          if (this._overlayId) {
            this._overlays.remove(this._overlayId);
            this._overlayId = undefined;
          }
          this._dropdownContainer2.currentElement = undefined;
          this._currentDropdownTarget = undefined;
        };

        const closeOverlay = appendOverlayListeners(this._dropdownContainer2);
        eventBus.once("element.contextmenu", (event) => {
          if (
            this._currentDropdownTarget &&
            (event.element || event.shape).businessObject !==
              this._currentDropdownTarget
          ) {
            closeOverlay(event);
            event.preventDefault();
          }
        });

        // Show the menu(e)
        this._overlayId = overlays.add(element.id, "classSelection", {
          position: {
            bottom: 0,
            right: 0,
          },
          scale: false,
          html: this._dropdownContainer2,
        });

        this._currentDropdownTarget = element.businessObject;
      }
    });
  }

  updateName(newName, element) {
    element.businessObject.name = newName;
    this._eventBus.fire("element.changed", {
      element,
    });
  }

  // updateCapacity(newCapacity, element) {
  //     element.businessObject.capacity = newCapacity;
  //     this._eventBus.fire('element.changed', {
  //         element
  //     });
  // }

  // createRole(name) {
  //     return this._eventBus.fire(CommonEvents.ROLE_CREATION_REQUESTED, {
  //         name
  //     });
  // }

  // updateRoles(newRole, element) {
  //     if ((element.businessObject.roles?.find(role => role === newRole))) {
  //         element.businessObject.roles = without(element.businessObject.roles, newRole);
  //     } else if (element.businessObject.roles) {
  //         element.businessObject.roles.push(newRole);
  //     } else {
  //         element.businessObject.roles = [newRole];
  //     }
  //     this._eventBus.fire('element.changed', {
  //         element
  //     });
  // }

  // updateavailabilityStart(newAvailabilityStart, element) {
  //     element.businessObject.availabilityStart = newAvailabilityStart;
  //     this._eventBus.fire('element.changed', {
  //         element
  //     });
  // }

  // updateavailabilityEnd(newAvailabilityEnd, element) {
  //     element.businessObject.availabilityEnd = newAvailabilityEnd;
  //     this._eventBus.fire('element.changed', {
  //         element
  //     });
  // }
}

ResourceLabelHandler.$inject = [
  "eventBus",
  "modeling",
  "directEditing",
  "overlays",
  "resourceModeler",
];
