import React, {Component, PropTypes} from 'react';
import TodoItem from './todo-item';

class MainSection extends Component {
    static propTypes = {
        $todos: PropTypes.object,
        filter: PropTypes.string
    };

    renderItems = () => {
        const {filter, $todos} = this.props;

        return $todos.map((item, i) => {
            const id = item.get('id');
            const text = item.get('text');
            const complete = item.get('complete');

            if (filter === 'all' ||
                (filter === 'completed' && complete) ||
                (filter === 'active' && !complete)
            ) {
                return (
                    <TodoItem
                        id={id}
                        text={text}
                        complete={complete}
                        key={`todo-item-${i}`} />
                );
            }
        });
    };

    render () {
        return (
            <section>
                <ul className="todo-list">
                    {this.renderItems()}
                </ul>
            </section>
        )
    };
};

export default MainSection;
