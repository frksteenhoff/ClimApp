package com.example.android.climapp;

/**
 * Created by frksteenhoff on 05-11-2017.
 * Used to get lon/lat pairs on proper form for use on API connection
 */

public class Pair<L,R> {
        private final L left;
        private final R right;

        public Pair(L left, R right) {
            this.left = left;
            this.right = right;
        }

        public L getLeft() { return left; }
        public R getRight() { return right; }

}
