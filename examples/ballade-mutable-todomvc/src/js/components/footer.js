import React, { PropTypes } from 'react';
import todoActions from '../actions/todos';

class Header extends React.Component {
    static propTypes = {
        onFilter: PropTypes.func,
        filter: PropTypes.string
    }

    hanldeFilter = (event) => {
        const conditions = event.target.dataset.filter;

        this.props.onFilter(conditions);
    }

    renderFilter = () => {
        return ['all', 'active', 'completed'].map((item, i) => {
            const className = this.props.filter === item ? 'current': '';

            return (
                <a
                    className={className}
                    key={`todo-filter-${i}`}
                    onClick={this.hanldeFilter}
                    data-filter={item}>
                    {item}
                </a>
            )
        });
    }

    render () {
        const filterElems = this.renderFilter();
        const {activeCount, completedCount} = this.props;

        return (
            <footer className="todo-footer">
                <p className="count">{activeCount} items left</p>
                <div className="filter">{filterElems}</div>
                {
                    completedCount > 0 ?
                    <a
                        className="clear-btn"
                        onClick={todoActions.deleteComplete}>
                        clear complete ({completedCount})</a> : ''
                }
            </footer>
        )
    }
};

export default Header;
