import React, {Component, PropTypes} from 'react';
import todoActions from '../actions/todos';
import TextInput from './text-input';

class TodoItem extends Component {
    state = {
        status: 'normal'
    };

    static propTypes = {
        id: PropTypes.string,
        complete: PropTypes.bool,
        text: PropTypes.string
    };

    handleUpdate = (text) => {
        this.setState({
            status: 'normal'
        }, () => {
            todoActions.update(this.props.id, text);
        });
    };

    handleToggle = () => {
        todoActions.toggle(this.props.id);
    };

    handleDelete = () => {
        todoActions.delete(this.props.id);
    };

    handleDoubleClick = () => {
        this.setState({
            status: 'editing'
        });
    };

    render () {
        const { id, text, complete } = this.props;
        const status = this.state.status;
        let toggleClassName = 'icon-font toggle';
        let textClassName = 'text';
        let itemElem;

        if (complete) {
            toggleClassName += ' completed';
            textClassName += ' completed';
        }

        if (status === 'editing') {
            itemElem = (
                <div className="item">
                    <TextInput
                        bindBlur={true}
                        onSave={this.handleUpdate}
                        value={text} />
                </div>
            )
        }
        else {
            itemElem = (
                <div className="item" onDoubleClick={this.handleDoubleClick}>
                    <div className={textClassName}>{text}</div>
                    <a className="icon-font delete" onClick={this.handleDelete} />
                </div>
            )
        }

        return (
            <li>
                <a className={toggleClassName} onClick={this.handleToggle} />
                {itemElem}
            </li>
        )
    };
};

export default TodoItem;
