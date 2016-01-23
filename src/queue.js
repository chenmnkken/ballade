'use strict';

/**
 * Mini Queue Class
 * @param {Function} complete callback,
 * when queue is done, then invoke complete callback
 * @param {Boolean} whether execute workflow of loop
 */
var Queue = function (completeCallback, loop) {
    this.workflows = [];
    this.completeCallback = completeCallback;

    if (loop) {
        this._workflows = [];
    }
};

Queue.prototype = {
    /**
     * Enter queue
     * @param {Function} workflow function
     */
    enter: function (workflow) {
        this.workflows.push(workflow);

        // Backup workflow
        if (this._workflows) {
            this._workflows.push(workflow);
        }
    },

    /**
     * Execute workflow
     * @param {Object} workflow function data required
     */
    execute: function (data) {
        var workflow;

        if (this.workflows.length) {
            workflow = this.workflows.shift();
            workflow(data, this.execute.bind(this));
        }
        else {
            // Get backup, begin loop
            if (this._workflows) {
                this.workflows = this._workflows.concat();
            }

            this.completeCallback(data);
        }
    }
};

module.exports = Queue;
