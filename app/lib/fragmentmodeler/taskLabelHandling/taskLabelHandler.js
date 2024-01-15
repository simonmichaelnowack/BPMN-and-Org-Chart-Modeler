import CommandInterceptor from "diagram-js/lib/command/CommandInterceptor";
import CommonEvents from "../../common/CommonEvents";
import getDropdown from "../../util/Dropdown";
import { appendOverlayListeners } from "../../util/HtmlUtil";
import { without } from "min-dash";

import { is } from "../../util/Util";

export default class TaskLabelHandler extends CommandInterceptor {
  constructor(eventBus, modeling, directEditing, overlays, resourceModeler) {
    super(eventBus);
    this._eventBus = eventBus;
    this._modeling = modeling;
    this._dropdownContainer = document.createElement("div");
    this._dropdownContainer.classList.add("dd-dropdown-multicontainer");

    this._rolesDropdown = getDropdown("Positions/Roles");
    this._dropdownContainer.appendChild(this._rolesDropdown);
    this._unitsDropdown = getDropdown("Organizational Units");
    this._dropdownContainer.appendChild(this._unitsDropdown);

    this._currentDropdownTarget = undefined;
    this._overlayId = undefined;
    this._overlays = overlays;
    this._resourceModeler = resourceModeler;

    eventBus.on("directEditing.activate", function (e) {
      if (is(e.active.element, "bpmn:Participant")) {
        directEditing.cancel();
      }
      if (is(e.active.element, "bpmn:Lane")) {
        directEditing.cancel();
      }
    });

    eventBus.on(["element.dblclick", "create.end", "autoPlace.end"], (e) => {
      const element = e.element || e.shape || e.elements[0];
      if (is(element, "bpmn:Participant")) {
        const resource = element.businessObject;
        this._dropdownContainer.currentElement = element;

        const updateRolesSelection = () => {
          // Clear selection for all entries
          this._rolesDropdown
            .getEntries()
            .forEach((entry) => entry.setSelected(false));

          // Set selected for the last entered role
          const lastRole =
            resource.roles && resource.roles.length > 0
              ? resource.roles[resource.roles.length - 1]
              : null;
          if (lastRole) {
            const selectedEntry = this._rolesDropdown
              .getEntries()
              .find((entry) => entry.option === lastRole);
            if (selectedEntry) {
              selectedEntry.setSelected(true);
            }
          }
        };

        const updateUnitsSelection = () => {
          this._unitsDropdown
            .getEntries()
            .forEach((entry) =>
              entry.setSelected(
                resource.units?.find((unit) => unit === entry.option)
              )
            );
        };

        const populateDropdown = (
          dropdown,
          items,
          updateFunction,
          updateSelectionFunction
        ) => {
          const newestItem = items.length > 0 ? items[items.length - 1] : null;

          dropdown.populate(
            items,
            (item, element) => {
              updateFunction(item, element);
              updateSelectionFunction();
            },
            element
          );

          dropdown.getEntries().forEach((entry) => {
            entry.addEventListener("click", (event) => {
              const selectedItem = entry.option;

              // Clear selection for all entries in both dropdowns
              this._rolesDropdown.getEntries().forEach((roleEntry) => {
                roleEntry.setSelected(false);
              });

              this._unitsDropdown.getEntries().forEach((unitEntry) => {
                unitEntry.setSelected(false);
              });

              // Update the function for the clicked dropdown
              if (dropdown === this._rolesDropdown) {
                this.updateRoles(selectedItem, element);
                updateRolesSelection();
                // Clear selection in Units dropdown
                this._unitsDropdown.getEntries().forEach((unitEntry) => {
                  unitEntry.setSelected(false);
                });
                // Set selected for the clicked entry in Units dropdown
                entry.setSelected(true);
              } else if (dropdown === this._unitsDropdown) {
                this.updateUnits(selectedItem, element);
                updateUnitsSelection();
                // Clear selection in Roles dropdown
                this._rolesDropdown.getEntries().forEach((roleEntry) => {
                  roleEntry.setSelected(false);
                });

                // Set selected for the clicked entry in Units dropdown
                entry.setSelected(true);
              }

              this._dropdownContainer.confirm();
            });
          });

          dropdown.addCreateElementInput((event) =>
            this._dropdownContainer.confirm()
          );

          // Set selected state for the newest item
          const newestEntry = dropdown
            .getEntries()
            .find((entry) => entry.option === newestItem);
          if (newestEntry) {
            newestEntry.setSelected(true);
          }

          updateSelectionFunction();
        };

        const populateRolesDropdown = () => {
          const roles = this._resourceModeler._roles || [];
          populateDropdown(
            this._rolesDropdown,
            roles,
            (role, element) => {
              this.updateRoles(role, element);
            },
            () => {
              updateRolesSelection();
            }
          );
        };

        const populateUnitsDropdown = () => {
          const units = this._resourceModeler._units || [];
          populateDropdown(
            this._unitsDropdown,
            units,
            (unit, element) => {
              this.updateUnits(unit, element);
            },
            () => {
              updateUnitsSelection();
            }
          );
        };

        populateRolesDropdown();
        populateUnitsDropdown();

        this._dropdownContainer.confirm = (event) => {
          const newRoleInput = this._rolesDropdown.getInputValue().trim();

          if (
            newRoleInput !== "" &&
            !this._resourceModeler._roles?.find(
              (role) => role.name === newRoleInput
            )
          ) {
            let newRole = this.createRole(newRoleInput);
            this.updateRoles(newRole, element);
            populateRolesDropdown();
          }

          const newUnitInput = this._unitsDropdown.getInputValue().trim();

          if (
            newUnitInput !== "" &&
            !this._resourceModeler._units?.find(
              (unit) => unit.name === newUnitInput
            )
          ) {
            let newUnit = this.createUnit(newUnitInput);
            this.updateUnits(newUnit, element);
            populateUnitsDropdown();
          }
        };

        // this._dropdownContainer.confirm = (event) => {
        //   const newUnitInput = this._unitsDropdown.getInputValue().trim();

        //   if (
        //     newUnitInput !== "" &&
        //     !this._resourceModeler._units?.find(
        //       (unit) => unit.name === newUnitInput
        //     )
        //   ) {
        //     let newUnit = this.createUnit(newUnitInput);
        //     this.updateUnits(newUnit, element);
        //     populateUnitsDropdown();
        //   }
        // };

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

      if (is(element, "bpmn:Lane")) {
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

        const updateUnitsSelection = () => {
          this._unitsDropdown
            .getEntries()
            .forEach((entry) =>
              entry.setSelected(
                resource.units?.find((unit) => unit === entry.option)
              )
            );
        };

        const populateDropdown = (
          dropdown,
          items,
          updateFunction,
          updateSelectionFunction
        ) => {
          const newestItem = items.length > 0 ? items[items.length - 1] : null;

          dropdown.populate(
            items,
            (item, element) => {
              updateFunction(item, element);
              updateSelectionFunction();
            },
            element
          );

          dropdown.getEntries().forEach((entry) => {
            entry.addEventListener("click", (event) => {
              const selectedItem = entry.option;

              // Clear selection for all entries in both dropdowns
              this._rolesDropdown.getEntries().forEach((roleEntry) => {
                roleEntry.setSelected(false);
              });

              this._unitsDropdown.getEntries().forEach((unitEntry) => {
                unitEntry.setSelected(false);
              });

              // Update the function for the clicked dropdown
              if (dropdown === this._rolesDropdown) {
                this.updateRoles(selectedItem, element);
                updateRolesSelection();
                // Clear selection in Units dropdown
                this._unitsDropdown.getEntries().forEach((unitEntry) => {
                  unitEntry.setSelected(false);
                });
                // Set selected for the clicked entry in Units dropdown
                entry.setSelected(true);
              } else if (dropdown === this._unitsDropdown) {
                this.updateUnits(selectedItem, element);
                updateUnitsSelection();
                // Clear selection in Roles dropdown
                this._rolesDropdown.getEntries().forEach((roleEntry) => {
                  roleEntry.setSelected(false);
                });

                // Set selected for the clicked entry in Units dropdown
                entry.setSelected(true);
              }

              this._dropdownContainer.confirm();
            });
          });

          dropdown.addCreateElementInput((event) =>
            this._dropdownContainer.confirm()
          );

          // Set selected state for the newest item
          const newestEntry = dropdown
            .getEntries()
            .find((entry) => entry.option === newestItem);
          if (newestEntry) {
            newestEntry.setSelected(true);
          }

          updateSelectionFunction();
        };

        const populateRolesDropdown = () => {
          const roles = this._resourceModeler._roles || [];
          populateDropdown(
            this._rolesDropdown,
            roles,
            (role, element) => {
              this.updateRoles(role, element);
            },
            () => {
              updateRolesSelection();
            }
          );
        };

        const populateUnitsDropdown = () => {
          const units = this._resourceModeler._units || [];
          populateDropdown(
            this._unitsDropdown,
            units,
            (unit, element) => {
              this.updateUnits(unit, element);
            },
            () => {
              updateUnitsSelection();
            }
          );
        };

        populateRolesDropdown();
        populateUnitsDropdown();

        this._dropdownContainer.confirm = (event) => {
          const newRoleInput = this._rolesDropdown.getInputValue().trim();

          if (
            newRoleInput !== "" &&
            !this._resourceModeler._roles?.find(
              (role) => role.name === newRoleInput
            )
          ) {
            let newRole = this.createRole(newRoleInput);
            this.updateRoles(newRole, element);
            populateRolesDropdown();
          }

          const newUnitInput = this._unitsDropdown.getInputValue().trim();

          if (
            newUnitInput !== "" &&
            !this._resourceModeler._units?.find(
              (unit) => unit.name === newUnitInput
            )
          ) {
            let newUnit = this.createUnit(newUnitInput);
            this.updateUnits(newUnit, element);
            populateUnitsDropdown();
          }
        };

        // this._dropdownContainer.confirm = (event) => {
        //   const newUnitInput = this._unitsDropdown.getInputValue().trim();

        //   if (
        //     newUnitInput !== "" &&
        //     !this._resourceModeler._units?.find(
        //       (unit) => unit.name === newUnitInput
        //     )
        //   ) {
        //     let newUnit = this.createUnit(newUnitInput);
        //     this.updateUnits(newUnit, element);
        //     populateUnitsDropdown();
        //   }
        // };

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
    });
  }

  createRole(name) {
    return this._eventBus.fire(CommonEvents.ROLE_CREATION_REQUESTED, {
      name,
    });
  }

  updateRoles(newRole, element) {
    if (element.businessObject.roles?.find((role) => role === newRole)) {
      element.businessObject.roles = without(
        element.businessObject.roles,
        newRole
      );
    } else if (element.businessObject.roles) {
      element.businessObject.roles.push(newRole);
    } else {
      element.businessObject.roles = [newRole];
    }
    this._eventBus.fire("element.changed", {
      element,
    });
  }

  createUnit(name) {
    return this._eventBus.fire(CommonEvents.UNIT_CREATION_REQUESTED, {
      name,
    });
  }

  updateUnits(newUnit, element) {
    if (element.businessObject.units?.find((unit) => unit === newUnit)) {
      element.businessObject.units = without(
        element.businessObject.units,
        newUnit
      );
    } else if (element.businessObject.units) {
      element.businessObject.units.push(newUnit);
    } else {
      element.businessObject.units = [newUnit];
    }
    this._eventBus.fire("element.changed", {
      element,
    });
  }
}

TaskLabelHandler.$inject = [
  "eventBus",
  "modeling",
  "directEditing",
  "overlays",
  "fragmentModeler",
];
