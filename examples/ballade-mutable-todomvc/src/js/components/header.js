import React, {Component, PropTypes} from 'react';
import TextInput from './text-input';
import todoActions from '../actions/todos';

class Header extends Component {
    static propTypes = {
        completed: PropTypes.bool
    }

    handleSave = (text) => {
        todoActions.create(text);
    }

    handleToggle = () => {
        todoActions.toggleAll();
    }

    render () {
        let toggleClassName = 'icon-font toggle-all';

        if (this.props.completed) {
            toggleClassName += ' completed';
        }

        return (
            <header className="todo-header">
                <h1>todos</h1>
                <div>
                    <a className={toggleClassName}
                        onClick={this.handleToggle}/>
                    <TextInput
                        placeholder="What needs to be done?"
                        onSave={this.handleSave} />
                </div>
            </header>
        )
    }
};

export default Header;
